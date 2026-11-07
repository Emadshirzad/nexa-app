<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        Schema::create('other_incomes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->unsignedBigInteger('amount');
            $table->date('income_date')->index();
            $table->text('description')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('other_incomes');
    }
};
