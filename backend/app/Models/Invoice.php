<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'invoice_number', 'customer_id', 'invoice_date', 'status',
        'subtotal', 'item_discount_total', 'invoice_discount',
        'final_amount', 'paid_amount', 'outstanding_debt', 'notes',
        'issued_at', 'cancelled_at', 'cancellation_reason',
    ];

    protected $casts = [
        'invoice_date' => 'date:Y-m-d',
        'issued_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'subtotal' => 'integer',
        'item_discount_total' => 'integer',
        'invoice_discount' => 'integer',
        'final_amount' => 'integer',
        'paid_amount' => 'integer',
        'outstanding_debt' => 'integer',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
