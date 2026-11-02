<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        Schema::create('leads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('mobile');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->enum('status', ['new', 'following_up', 'interested', 'converted', 'unsuccessful', 'rejected'])->default('new')->index();
            $table->text('description')->nullable();
            $table->date('follow_up_date')->nullable()->index();
            $table->uuid('converted_customer_id')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();
            $table->foreign('converted_customer_id')->references('id')->on('customers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
