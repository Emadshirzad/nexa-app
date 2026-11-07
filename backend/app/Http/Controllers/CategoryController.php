<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();

        $query = Category::query()
            ->when($search !== '', fn (Builder $q) => $q->where('name', 'like', '%' . $search . '%'))
            ->orderByDesc('created_at');

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        $rows = $query->paginate($request->integer('per_page', 50));
        return response()->json($rows);
    }

    public function show(string $id): JsonResponse
    {
        return response()->json(Category::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:120'],
            'color' => ['nullable', 'string', 'max:16'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        return response()->json(Category::create($data), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = Category::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'color' => ['nullable', 'string', 'max:16'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $row->update($data);

        return response()->json($row->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        Category::findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }
}
