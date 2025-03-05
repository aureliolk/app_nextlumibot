"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Account {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  locale: number;
  domain: string | null;
  support_email: string | null;
  feature_flags: string;
  auto_resolve_duration: string | null;
  limits: Record<string, any>;
  custom_attributes: Record<string, any>;
  status: number;
}

export default function AccountsPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    botName: "",
    clientName: "",
    clientEmail: "",
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get("https://webhookn8n.lumibot.com.br/webhook/accounts/list");
      setAccounts(response.data || []); // Garante que é um array, mesmo se a resposta for vazia
    } catch (err) {
      setError("Erro ao carregar as contas.");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post("https://webhookn8n.lumibot.com.br/webhook/new/accounts", formData);
      setFormData({
        companyName: "",
        botName: "",
        clientName: "",
        clientEmail: "",
      });
      fetchAccounts(); // Atualiza a lista após criar uma nova conta
    } catch (err) {
      setError("Erro ao criar a conta.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Nova Conta</h1>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label htmlFor="companyName" className="block mb-1">Nome da Empresa</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="botName" className="block mb-1">Nome do Bot</label>
          <input
            type="text"
            id="botName"
            name="botName"
            value={formData.botName}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="clientName" className="block mb-1">Nome do Cliente</label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="clientEmail" className="block mb-1">Email do Cliente</label>
          <input
            type="email"
            id="clientEmail"
            name="clientEmail"
            value={formData.clientEmail}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? "Carregando..." : "Criar Conta"}
        </button>
      </form>

      <h2 className="text-2xl font-bold mb-4">Contas Criadas</h2>
      {Array.isArray(accounts) && accounts.length > 0 ? (
        <ul className="list-disc pl-5">
          {accounts.map((account) => (
            <li key={account.id} className="mb-2">
              {account.name} {/* Usamos "name" como "Nome da Empresa" ou "Nome do Bot" */}
              {account.support_email && ` (Email: ${account.support_email})`} {/* Email do Cliente, se existir */}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhuma conta criada ainda.</p>
      )}
    </div>
  );
}