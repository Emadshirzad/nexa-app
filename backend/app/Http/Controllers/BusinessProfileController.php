<?php

namespace App\Http\Controllers;

use App\Models\BusinessProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BusinessProfileController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(BusinessProfile::first());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:120'],
            'address' => ['nullable', 'string', 'max:250'],
            'description' => ['nullable', 'string'],
        ]);

        $profile = BusinessProfile::first();
        if ($profile === null) {
            $profile = BusinessProfile::create($data);
        } else {
            $profile->update($data);
        }

        return response()->json($profile);
    }
}
