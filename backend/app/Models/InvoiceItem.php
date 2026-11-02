<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    use HasFactory, HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = [
        'invoice_id', 'product_id', 'product_name_snapshot', 'sku_snapshot', 'unit_snapshot',
        'unit_price_snapshot', 'quantity', 'discount_amount', 'line_total',
    ];

    protected $casts = [
        'unit_price_snapshot' => 'integer',
        'quantity' => 'integer',
        'discount_amount' => 'integer',
        'line_total' => 'integer',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
