<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OtherIncome extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'title', 'amount', 'income_date', 'description', 'payment_method',
    ];

    protected $casts = [
        'amount' => 'integer',
        'income_date' => 'date:Y-m-d',
    ];
}
