<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();
        $today = now()->toDateString();

        $extraFilter = fn (Builder $q, Request $r) => $q
            ->when($r->filled('status'), fn (Builder $q) => $q->where('status', $r->string('status')))
            ->when($r->filled('priority'), fn (Builder $q) => $q->where('priority', $r->string('priority')))
            ->when($r->filled('due_date'), fn (Builder $q) => $q->whereDate('due_date', $r->string('due_date')))
            ->when($r->filled('related_type'), fn (Builder $q) => $q->where('related_type', $r->string('related_type')))
            ->when($r->filled('related_id'), fn (Builder $q) => $q->where('related_id', $r->string('related_id')))
            ->when($r->boolean('due_today'), fn (Builder $q) => $q->where('status', '!=', 'completed')->whereDate('due_date', '<=', $today))
            ->when($r->boolean('overdue'), fn (Builder $q) => $q->where('status', '!=', 'completed')->whereDate('due_date', '<', $today));

        $query = Task::query()
            ->tap(fn (Builder $q) => $extraFilter($q, $request))
            ->when($search !== '', fn (Builder $q) => $q->where(function ($w) use ($search) {
                foreach (['title'] as $field) {
                    $w->orWhere($field, 'like', '%' . $search . '%');
                }
            }))
            ->orderByDesc('created_at');

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        $limit = $request->integer('limit');
        if ($limit > 0) {
            return response()->json($query->limit($limit)->get());
        }

        $rows = $query->paginate($request->integer('per_page', 50));
        return response()->json($rows);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Task::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'due_date' => ['required', 'date'],
            'priority' => ['nullable', 'string', 'in:normal,urgent'],
            'status' => ['nullable', 'string', 'in:pending,in_progress,completed'],
            'related_type' => ['nullable', 'string'],
            'related_id' => ['nullable', 'uuid'],
            'completed_at' => ['nullable', 'date'],
        ]);

        return response()->json(Task::create($data), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = Task::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'due_date' => ['sometimes', 'date'],
            'priority' => ['nullable', 'string', 'in:normal,urgent'],
            'status' => ['nullable', 'string', 'in:pending,in_progress,completed'],
            'related_type' => ['nullable', 'string'],
            'related_id' => ['nullable', 'uuid'],
            'completed_at' => ['nullable', 'date'],
        ]);

        $row->update($data);

        return response()->json($row->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        Task::findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }

    public function complete(string $id): JsonResponse
    {
        $row = Task::findOrFail($id);
        $row->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return response()->json($row->fresh());
    }
}
