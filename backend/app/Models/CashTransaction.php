<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashTransaction extends Model
{
    use HasFactory, HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = [
        'transaction_type', 'amount', 'balance_after',
        'reference_type', 'reference_id', 'description', 'transaction_date',
    ];

    protected $casts = [
        'amount' => 'integer',
        'balance_after' => 'integer',
        'transaction_date' => 'date:Y-m-d',
    ];
}
