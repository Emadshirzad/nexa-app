<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('invoice_id')->cascadeOnDelete()->index();
            $table->uuid('product_id')->nullable();
            $table->string('product_name_snapshot');
            $table->string('sku_snapshot');
            $table->string('unit_snapshot');
            $table->unsignedBigInteger('unit_price_snapshot');
            $table->unsignedBigInteger('quantity');
            $table->unsignedBigInteger('discount_amount')->default(0);
            $table->unsignedBigInteger('line_total');
            $table->timestamp('created_at');
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
