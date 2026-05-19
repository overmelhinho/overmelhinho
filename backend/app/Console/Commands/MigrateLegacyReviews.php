<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Cliente;
use App\Models\ClienteReview;

class MigrateLegacyReviews extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:legacy-reviews';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate manual Google reviews from legacy database to the new system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting legacy reviews migration...');

        $legacyReviews = DB::connection('legacy')->table('comentario_google')->get();

        $this->info('Found ' . $legacyReviews->count() . ' reviews in legacy database.');

        $migrated = 0;
        $skipped = 0;

        $bar = $this->output->createProgressBar($legacyReviews->count());

        foreach ($legacyReviews as $legacy) {
            // Find the client in the new database using exact same ID
            $cliente = Cliente::find($legacy->id_clientes);

            if (!$cliente) {
                $skipped++;
                $bar->advance();
                continue;
            }

            // Clean data
            $nome = trim($legacy->nome);
            $texto = trim($legacy->descricao);
            $estrelas = (int) $legacy->estrelas;

            if (empty($nome) && empty($texto)) {
                $skipped++;
                $bar->advance();
                continue;
            }

            // Create or update review
            ClienteReview::updateOrCreate(
                ['google_review_id' => 'legacy_' . $legacy->id],
                [
                    'cliente_id' => $cliente->id,
                    'author_name' => $nome ?: 'Cliente Anônimo',
                    'author_photo_url' => null,
                    'rating' => $estrelas > 0 && $estrelas <= 5 ? $estrelas : 5, // Fallback to 5 if invalid
                    'text' => $texto,
                    'relative_time_description' => null,
                    'is_visible' => DB::raw('true'),
                ]
            );

            $migrated++;
            $bar->advance();
        }

        $bar->finish();

        $this->newLine();
        $this->info("Migration completed! Migrated: {$migrated}. Skipped (client not found/empty): {$skipped}.");
    }
}
