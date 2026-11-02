<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name', 'mobile', 'phone', 'email', 'status',
        'description', 'follow_up_date', 'converted_customer_id', 'converted_at',
    ];

    protected $casts = [
        'follow_up_date' => 'date:Y-m-d',
        'converted_at' => 'datetime',
    ];

    public function convertedCustomer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'converted_customer_id');
    }
}
