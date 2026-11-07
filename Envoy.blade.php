{{--
    Nexa deploy runner — release-per-commit, docker compose based.

    Modeled on the concert project's deploy file, but adapted to Nexa's
    containerized stack: instead of a bare-PHP release directory behind the
    shared php-fpm, each release is a full git checkout that is built into the
    nexa-api:local / nexa-web:local images and brought up through
    `compose.yaml + compose.server.yml`.

    Every value is overridable by an environment variable; defaults match
    irpaymard (deploy@irpaymard).

    DEPLOY_USER            SSH user                 (default: deploy)
    DEPLOY_SSH_ALIAS       ~/.ssh/config host       (default: irpaymard)
    DEPLOY_REPOSITORY      git remote the SERVER clones from. The server uses
                           its own deploy key (~/.ssh/nexa/github_deploy_key),
                           which must be added to the repo's deploy keys.
    APP_PATH               deploy root              (default: /var/www/nexa)
    KEEP_RELEASES          releases retained        (default: 4)
    APP_DOMAIN             public domain, used by traefik labels
                           (default: nexa.shirzadd.ir)

    Tasks can also be run standalone:
      envoy run deploy --commit=<sha>
      envoy run rollback
      envoy run status
--}}

@servers(['web' => (getenv('DEPLOY_USER') ?: 'deploy').'@'.(getenv('DEPLOY_SSH_ALIAS') ?: 'irpaymard')])

@setup
    $app_dir = rtrim(getenv('APP_PATH') ?: '/var/www/nexa', '/');
    $releases_dir = $app_dir.'/releases';
    $shared_dir = $app_dir.'/shared';
    $release = date('YmdHis');
    $new_release_dir = $releases_dir.'/'.$release;
    $keep_releases = max(3, (int) (getenv('KEEP_RELEASES') ?: 4));

    $repository = getenv('DEPLOY_REPOSITORY') ?: 'git@github.com:Emadshirzad/nexa-app.git';

    $compose = '-f compose.yaml -f compose.server.yml';

    // CI (GitHub Actions) uploads the built SPA here before `envoy run deploy`;
    // inject_dist moves it into the release. If missing, compose still works —
    // the web image falls back to building the SPA inside Docker.
    $dist_incoming = $shared_dir.'/dist-incoming';
@endsetup

@story('deploy')
    ensure_layout
    clone_repository
    inject_dist
    build_images
    deploy_stack
    cleanup
@endstory

@task('ensure_layout')
    set -e
    echo "Ensuring layout at {{ $app_dir }}"
    mkdir -p {{ $releases_dir }} {{ $shared_dir }}
    # Shared .env must exist. It is server-owned and never lives in git.
    if [ ! -f {{ $shared_dir }}/.env ]; then
        echo "ERROR: {{ $shared_dir }}/.env is missing; run backend/deploy/provision-server.sh first"
        exit 1
    fi
@endtask

@task('clone_repository')
    set -e
    echo "Fetching {{ $commit }}"
    mkdir -p {{ $new_release_dir }}
    cd {{ $new_release_dir }}
    git init -q
    git remote add origin {{ $repository }}
    # Fetch the exact commit (same trick as concert): a shallow clone only has
    # the default-branch tip, so resetting to a stale tip would fail when
    # another push lands mid-deploy.
    git fetch --depth 1 origin {{ $commit }}
    git checkout -q FETCH_HEAD
@endtask

@task('inject_dist')
    set -e
    if [ -d {{ $dist_incoming }} ] && [ -s {{ $dist_incoming }}/index.html ]; then
        echo 'Installing prebuilt frontend dist from CI'
        rm -rf {{ $new_release_dir }}/frontend/dist
        mkdir -p {{ $new_release_dir }}/frontend/dist
        cp -a {{ $dist_incoming }}/. {{ $new_release_dir }}/frontend/dist/
        rm -rf {{ $dist_incoming }}
    else
        echo 'No prebuilt dist/ found; the web image will build the SPA during docker build'
    fi
@endtask

@task('build_images')
    set -e
    echo 'Linking .env into the release'
    rm -f {{ $new_release_dir }}/.env
    ln -nfs {{ $shared_dir }}/.env {{ $new_release_dir }}/.env
    # Local dev helpers must not confuse docker compose on the server.
    rm -f {{ $new_release_dir }}/.devdbrc

    echo 'Building images (nexa-api:local, nexa-web:local, cached between deploys)'
    cd {{ $new_release_dir }}
    {{ $compose }} build
@endtask

@task('deploy_stack')
    set -e
    echo 'Bringing the stack up'
    cd {{ $new_release_dir }}
    {{ $compose }} up -d --remove-orphans

    echo 'Waiting for the API container to report healthy'
    ok=''
    for attempt in $(seq 1 90); do
        status=$(docker inspect --format '@{{.State.Health.Status}}' nexa-api-1)
        if [ "$status" = 'healthy' ]; then
            echo "API container healthy after ${attempt}s"
            ok=1
            break
        fi
        sleep 2
    done
    if [ -z "$ok" ]; then
        echo 'ERROR: API container never became healthy. Logs:'
        docker logs --tail 50 nexa-api-1
        exit 1
    fi

    echo 'Current release:'
    docker compose ps
@endtask

@task('status')
    cd $(readlink -f /var/www/nexa/current 2>/dev/null || echo /var/www/nexa)
    {{ $compose }} ps
@endtask

@task('cleanup')
    set -e
    echo 'Cleaning up old releases'
    cd {{ $releases_dir }}
    ls -t | tail -n +{{ $keep_releases + 1 }} | xargs -r rm -rf
    # Dangling build cache, not the tagged images (rollback needs those).
    docker image prune -f >/dev/null 2>&1 || true
@endtask
