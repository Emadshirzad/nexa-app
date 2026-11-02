<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerNote;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CustomerNoteController extends Controller
{
    public function index(string $customerId): JsonResponse
    {
        return response()->json(
            CustomerNote::where('customer_id', $customerId)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function store(Request $request, string $customerId): JsonResponse
    {
        Customer::findOrFail($customerId);

        $data = $request->validate(['content' => ['required', 'string', 'max:2000']]);

        $note = CustomerNote::create([
            'customer_id' => $customerId,
            'content' => $data['content'],
        ]);

        return response()->json($note, 201);
    }
}
