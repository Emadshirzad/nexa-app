<?php

use App\Http\Controllers\AppSettingController;
use App\Http\Controllers\BusinessProfileController;
use App\Http\Controllers\CashLedgerController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\CustomerNoteController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\OtherIncomeController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Base health probe
    Route::get('/health', [HealthController::class, 'index']);

    // Business profile
    Route::get('/business-profile', [BusinessProfileController::class, 'index']);
    Route::post('/business-profile', [BusinessProfileController::class, 'store']);

    // Key-value app settings
    Route::get('/settings', [AppSettingController::class, 'index']);
    Route::get('/settings/{key}', [AppSettingController::class, 'show']);
    Route::put('/settings/{key}', [AppSettingController::class, 'update']);

    // Products specific routes
    Route::get('products/next-sku', [ProductController::class, 'nextSku']);
    Route::get('products/{id}/has-history', [ProductController::class, 'hasHistory']);
    Route::apiResource('products', ProductController::class);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Customers specific routes
    Route::get('customers/tags', [CustomerController::class, 'tags']);
    Route::get('customers/{id}/financial-summary', [CustomerController::class, 'financialSummary']);
    Route::get('customers/{customerId}/notes', [CustomerNoteController::class, 'index']);
    Route::post('customers/{customerId}/notes', [CustomerNoteController::class, 'store']);
    Route::get('customers/{customerId}/payments', [PaymentController::class, 'listByCustomer']);
    Route::apiResource('customers', CustomerController::class);

    // Invoices specific routes
    Route::get('invoices/next-number', [InvoiceController::class, 'nextNumber']);
    Route::get('invoices/{id}/has-cancellation-movements', [InvoiceController::class, 'hasCancellationMovements']);
    Route::get('invoices/{invoiceId}/payments', [PaymentController::class, 'index']);
    Route::post('invoices/{invoiceId}/payments', [PaymentController::class, 'store']);
    Route::apiResource('invoices', InvoiceController::class);

    // Payments
    Route::get('payments', [PaymentController::class, 'listAll']);
    Route::patch('payments/{paymentId}/void', [PaymentController::class, 'void']);

    // Leads specific routes
    Route::get('leads/status-counts', [LeadController::class, 'statusCounts']);
    Route::apiResource('leads', LeadController::class);

    // Tasks specific routes
    Route::patch('tasks/{id}/complete', [TaskController::class, 'complete']);
    Route::apiResource('tasks', TaskController::class);

    // Expenses & Other Incomes
    Route::apiResource('expenses', ExpenseController::class);
    Route::apiResource('other-incomes', OtherIncomeController::class);

    // Stock Movements
    Route::get('stock-movements', [StockMovementController::class, 'index']);
    Route::post('stock-movements', [StockMovementController::class, 'store']);
    Route::get('stock-movements/reconciled/{productId}', [StockMovementController::class, 'reconciled']);

    // Cash Ledger
    Route::get('cash-transactions', [CashLedgerController::class, 'index']);
    Route::get('cash-transactions/balance', [CashLedgerController::class, 'balance']);
    Route::get('cash-transactions/summary', [CashLedgerController::class, 'summary']);

    // Reports & Dashboard
    Route::get('reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('reports/monthly-trends', [ReportController::class, 'monthlyTrends']);
    Route::get('reports/top-products', [ReportController::class, 'topProducts']);
    Route::get('reports/debtors', [ReportController::class, 'debtors']);
    Route::get('reports/low-stock', [ReportController::class, 'lowStock']);
    Route::get('reports/global-search', [ReportController::class, 'globalSearch']);
});
