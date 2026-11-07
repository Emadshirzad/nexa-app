<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_returns_ok(): void
    {
        $response = $this->getJson('/api/v1/health');
        $response->assertStatus(200)->assertJson(['status' => 'ok']);
    }

    public function test_product_flow_and_sku_generation(): void
    {
        $nextSkuRes = $this->getJson('/api/v1/products/next-sku');
        $nextSkuRes->assertStatus(200)->assertJson(['next_sku' => 'P-1001']);

        $createRes = $this->postJson('/api/v1/products', [
            'name' => 'لپ‌تاپ تست',
            'sku' => 'P-1001',
            'unit' => 'piece',
            'selling_price' => 25000000,
            'stock_quantity' => 5000,
            'min_stock_threshold' => 1000,
        ]);
        $createRes->assertStatus(201);
        $productId = $createRes->json('id');

        $hasHistoryRes = $this->getJson("/api/v1/products/{$productId}/has-history");
        $hasHistoryRes->assertStatus(200)->assertJson(['has_history' => false]);
    }

    public function test_customer_flow_and_financial_summary(): void
    {
        $createRes = $this->postJson('/api/v1/customers', [
            'name' => 'سارا ناصری',
            'mobile' => '09121112233',
            'tags' => ['VIP', 'تهران'],
        ]);
        $createRes->assertStatus(201);
        $customerId = $createRes->json('id');

        $tagsRes = $this->getJson('/api/v1/customers/tags');
        $tagsRes->assertStatus(200);
        $this->assertContains('VIP', $tagsRes->json());

        $summaryRes = $this->getJson("/api/v1/customers/{$customerId}/financial-summary");
        $summaryRes->assertStatus(200)->assertJson([
            'totalPurchases' => 0,
            'totalPayments' => 0,
            'outstandingDebt' => 0,
            'invoiceCount' => 0,
        ]);
    }

    public function test_task_creation_and_completion(): void
    {
        $createRes = $this->postJson('/api/v1/tasks', [
            'title' => 'تماس تلفنی',
            'due_date' => now()->toDateString(),
            'priority' => 'urgent',
            'status' => 'pending',
        ]);
        $createRes->assertStatus(201);
        $taskId = $createRes->json('id');

        $completeRes = $this->patchJson("/api/v1/tasks/{$taskId}/complete");
        $completeRes->assertStatus(200)->assertJson(['status' => 'completed']);
        $this->assertNotNull($completeRes->json('completed_at'));
    }

    public function test_stock_movement_and_reconciliation(): void
    {
        $prodRes = $this->postJson('/api/v1/products', [
            'name' => 'ماوس تست',
            'sku' => 'P-1002',
            'selling_price' => 500000,
            'stock_quantity' => 10000,
        ]);
        $productId = $prodRes->json('id');

        $moveRes = $this->postJson('/api/v1/stock-movements', [
            'product_id' => $productId,
            'movement_type' => 'addition',
            'quantity' => 5000,
            'reason' => 'ورود اولیه انبار',
        ]);
        $moveRes->assertStatus(201);

        $reconciledRes = $this->getJson("/api/v1/stock-movements/reconciled/{$productId}");
        $reconciledRes->assertStatus(200)->assertJson([
            'product_id' => $productId,
            'reconciled_stock' => 5000,
        ]);
    }

    public function test_paginated_list_endpoints_do_not_error(): void
    {
        foreach ([
            'products',
            'categories',
            'customers',
            'leads',
            'tasks',
            'expenses',
            'other-incomes',
            'invoices',
            'payments',
            'stock-movements',
            'cash-transactions',
        ] as $resource) {
            $response = $this->getJson("/api/v1/{$resource}");
            $response->assertStatus(200, "GET /api/v1/{$resource} failed");
        }
    }

    public function test_list_filters_apply(): void
    {
        $this->postJson('/api/v1/tasks', [
            'title' => 'کار امروز',
            'due_date' => now()->toDateString(),
            'status' => 'pending',
            'priority' => 'urgent',
        ])->assertStatus(201);

        $filtered = $this->getJson('/api/v1/tasks?due_today=1');
        $filtered->assertStatus(200)
            ->assertJsonStructure(['current_page', 'data', 'per_page']);

        $this->getJson('/api/v1/tasks?limit=5')->assertStatus(200);
        $this->getJson('/api/v1/products?all=1')->assertStatus(200);
        $this->getJson('/api/v1/customers?tag=VIP')->assertStatus(200);
    }

    public function test_other_income_lifecycle(): void
    {
        $createRes = $this->postJson('/api/v1/other-incomes', [
            'title' => 'اجاره',
            'amount' => 1000000,
            'income_date' => now()->toDateString(),
        ]);
        $createRes->assertStatus(201);
        $incomeId = $createRes->json('id');
        $this->assertNotNull($incomeId);

        $balanceRes = $this->getJson('/api/v1/cash-transactions/balance');
        $this->assertGreaterThan(0, $balanceRes->json('balance'));

        $deleteRes = $this->deleteJson("/api/v1/other-incomes/{$incomeId}");
        $deleteRes->assertStatus(200);

        $balanceAfter = $this->getJson('/api/v1/cash-transactions/balance');
        $this->assertGreaterThanOrEqual(0, $balanceAfter->json('balance'));
    }

    public function test_reports_dashboard_and_search(): void
    {
        $dashRes = $this->getJson('/api/v1/reports/dashboard');
        $dashRes->assertStatus(200)
            ->assertJsonStructure([
                'todaySales',
                'todaySalesCount',
                'todayReceipts',
                'totalOutstandingDebt',
                'pendingTasksTodayCount',
                'cashBalance',
                'lowStockCount',
                'recentInvoices',
                'todayTasks',
            ]);
    }
}
