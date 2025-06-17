import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <h1>Bem-vindo</h1>
      <Link to="/lead-form" className="text-blue-500 hover:underline">
        Ir para Cadastro de Lead
      </Link>
    </div>
  );
}
