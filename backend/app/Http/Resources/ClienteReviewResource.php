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
            'author_name' => $this->author_name ? html_entity_decode($this->author_name, ENT_QUOTES | ENT_HTML5, 'UTF-8') : null,
            'author_photo_url' => $this->author_photo_url,
            'profile_photo_url' => $this->author_photo_url, // Alias para compatibilidade
            'rating' => (int)($this->rating ?? 5),
            'text' => $this->text ? html_entity_decode($this->text, ENT_QUOTES | ENT_HTML5, 'UTF-8') : null,
            'time' => $this->relative_time_description ? $this->relative_time_description->timestamp : null,
            'relative_time_description' => $this->relative_time_description ? $this->relative_time_description->diffForHumans() : "há algum tempo",
            'google_review_id' => $this->google_review_id,
            'is_visible' => (bool)$this->is_visible,
        ];
    }
}
