<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'category_id', 'title', 'amount', 'expense_date', 'description', 'payment_method',
    ];

    protected $casts = [
        'amount' => 'integer',
        'expense_date' => 'date:Y-m-d',
    ];
}
