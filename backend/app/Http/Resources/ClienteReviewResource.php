<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClienteReviewResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'cliente_id' => $this->cliente_id,
            'author_name' => $this->author_name,
            'author_photo_url' => $this->author_photo_url,
            'rating' => $this->rating,
            'text' => $this->text,
            'relative_time_description' => $this->relative_time_description ? $this->relative_time_description->toISOString() : null,
            'google_review_id' => $this->google_review_id,
            'is_visible' => $this->is_visible,
        ];
    }
}
