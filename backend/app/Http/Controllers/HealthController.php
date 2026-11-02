<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            DB::select('SELECT 1');
            $db = 'ok';
        } catch (\Throwable $e) {
            $db = 'down: ' . $e->getMessage();
        }

        return response()->json([
            'status' => $db === 'ok' ? 'ok' : 'degraded',
            'app' => config('app.name'),
            'database' => $db,
            'time' => now()->toIso8601String(),
        ]);
    }
}
