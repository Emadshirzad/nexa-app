<?php

use App\Http\Controllers\AppSettingController;
use App\Http\Controllers\BusinessProfileController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerNoteController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Base health probe for compose / monitoring
    Route::get('/health', [HealthController::class, 'index']);

    // Business profile (single record, upserted via POST)
    Route::get('/business-profile', [BusinessProfileController::class, 'index']);
    Route::post('/business-profile', [BusinessProfileController::class, 'store']);

    // Key-value app settings
    Route::get('/settings', [AppSettingController::class, 'index']);
    Route::get('/settings/{key}', [AppSettingController::class, 'show']);
    Route::put('/settings/{key}', [AppSettingController::class, 'update']);

    // Resources
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('leads', LeadController::class);
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('expenses', ExpenseController::class);
    Route::apiResource('invoices', InvoiceController::class);

    // Nested resources
    Route::get('invoices/{invoiceId}/payments', [PaymentController::class, 'index']);
    Route::post('invoices/{invoiceId}/payments', [PaymentController::class, 'store']);
    Route::patch('payments/{paymentId}/void', [PaymentController::class, 'void']);

    Route::get('customers/{customerId}/notes', [CustomerNoteController::class, 'index']);
    Route::post('customers/{customerId}/notes', [CustomerNoteController::class, 'store']);
});
