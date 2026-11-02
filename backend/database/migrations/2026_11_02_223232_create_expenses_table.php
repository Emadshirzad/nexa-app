<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('category_id')->nullable();
            $table->string('title');
            $table->unsignedBigInteger('amount');
            $table->date('expense_date')->index();
            $table->text('description')->nullable();
            $table->enum('payment_method', ['cash', 'card_transfer', 'pos', 'bank_transfer', 'other'])->default('cash');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
