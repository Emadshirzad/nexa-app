<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory, HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = [
        'invoice_id', 'customer_id', 'amount', 'payment_method',
        'payment_date', 'reference_number', 'notes',
        'is_voided', 'voided_at', 'void_reason',
    ];

    protected $casts = [
        'amount' => 'integer',
        'payment_date' => 'date:Y-m-d',
        'is_voided' => 'boolean',
        'voided_at' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
