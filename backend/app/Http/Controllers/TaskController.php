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
        $extraFilter = fn (Builder $q, Request $r) => $q
        ->when($r->filled('status'), fn (Builder $q) => $q->where('status', $r->string('status')))
        ->when($r->filled('priority'), fn (Builder $q) => $q->where('priority', $r->string('priority')))
        ->when($r->boolean('due_today'), fn (Builder $q) => $q->whereDate('due_date', '<=', now()->toDateString()))
    ;

        $rows = Task::query()
            ->when($extraFilter, function (Builder $q) use ($request) { $extraFilter($q, $request); })
            ->when($search !== '', fn (Builder $q) => $q->where(function ($w) use ($search) {
                foreach (['title'] as $field) {
                    $w->orWhere($field, 'like', '%' . $search . '%');
                }
            }))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 50));

        return response()->json($rows);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Task::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
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
}
