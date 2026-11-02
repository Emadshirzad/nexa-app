<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('invoice_id')->nullable()->restrictOnDelete()->index();
            $table->foreignUuid('customer_id')->nullable()->restrictOnDelete()->index();
            $table->unsignedBigInteger('amount');
            $table->enum('payment_method', ['cash', 'card_transfer', 'pos', 'bank_transfer', 'other']);
            $table->date('payment_date')->index();
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_voided')->default(false);
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
