<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AppSettingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(AppSetting::all()->pluck('value', 'key'));
    }

    public function show(string $key): JsonResponse
    {
        return response()->json([
            'key' => $key,
            'value' => AppSetting::find($key)?->value,
        ]);
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $data = $request->validate(['value' => ['required', 'string']]);

        AppSetting::updateOrCreate(
            ['key' => $key],
            ['value' => $data['value'], 'updated_at' => now()],
        );

        return response()->json(['key' => $key, 'value' => $data['value']]);
    }
}
