export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="text-center max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter sm:text-5xl">
          Encontre os melhores serviços da sua cidade!
        </h1>
        <p className="text-lg text-gray-500 font-medium">
          O Vermelhinho te conecta aos negócios locais com facilidade e rapidez.
        </p>

        <div className="mt-8 flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-2 w-full shadow-sm focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500 transition-all">
          <input
            type="text"
            placeholder="O que você está procurando? (Ex: Pet Shop, Pizzaria...)"
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-4 py-3 text-gray-700 font-medium w-full"
          />
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-sm">
            Buscar
          </button>
        </div>
      </div>
    </main>
  );
}
