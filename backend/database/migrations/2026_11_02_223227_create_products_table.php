<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('category_id')->nullable()->index();
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('unit')->default('piece');
            $table->unsignedBigInteger('selling_price')->default(0);
            $table->unsignedBigInteger('stock_quantity')->default(0);
            $table->unsignedBigInteger('min_stock_threshold')->default(0);
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
