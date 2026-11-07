<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;

class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('q')->trim();
        $extraFilter = fn (Builder $q, Request $r) => $q
            ->when($r->filled('status'), fn (Builder $q) => $q->where('status', $r->string('status')));

        $query = Lead::query()
            ->tap(fn (Builder $q) => $extraFilter($q, $request))
            ->when($search !== '', fn (Builder $q) => $q->where(function ($w) use ($search) {
                foreach (['name', 'mobile'] as $field) {
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
        return response()->json(Lead::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'name' => ['required', 'string', 'max:120'],
            'mobile' => ['required', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email'],
            'status' => ['nullable', 'string', 'in:new,following_up,interested,converted,unsuccessful,rejected'],
            'description' => ['nullable', 'string'],
            'follow_up_date' => ['nullable', 'date'],
            'converted_customer_id' => ['nullable', 'uuid'],
            'converted_at' => ['nullable', 'date'],
        ]);

        return response()->json(Lead::create($data), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = Lead::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'mobile' => ['sometimes', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email'],
            'status' => ['nullable', 'string', 'in:new,following_up,interested,converted,unsuccessful,rejected'],
            'description' => ['nullable', 'string'],
            'follow_up_date' => ['nullable', 'date'],
            'converted_customer_id' => ['nullable', 'uuid'],
            'converted_at' => ['nullable', 'date'],
        ]);

        $row->update($data);

        return response()->json($row->fresh());
    }

    public function destroy(string $id): JsonResponse
    {
        Lead::findOrFail($id)->delete();

        return response()->json(['deleted' => true]);
    }

    public function statusCounts(): JsonResponse
    {
        $counts = [
            'new' => 0,
            'following_up' => 0,
            'interested' => 0,
            'converted' => 0,
            'unsuccessful' => 0,
            'rejected' => 0,
        ];

        $dbCounts = Lead::query()
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        foreach ($dbCounts as $status => $count) {
            if (array_key_exists($status, $counts)) {
                $counts[$status] = (int) $count;
            }
        }

        return response()->json($counts);
    }
}
