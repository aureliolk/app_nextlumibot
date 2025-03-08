"use client";

import { useState, useEffect, useTransition } from "react";
import axios from "axios";
import Link from "next/link";

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

interface AccountFormData {
  companyName: string;
  botName: string;
  clientName: string;
  clientEmail: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  
  const [formData, setFormData] = useState<AccountFormData>({
    companyName: "",
    botName: "",
    clientName: "",
    clientEmail: "",
  });

  // Filtra as contas com base no termo de busca
  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.support_email && account.support_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchAccounts = async () => {
    try {
      const response = await axios.get("https://webhookn8n.lumibot.com.br/webhook/accounts/list");
      if (response.data) {
       
        setAccounts(response.data);
      }
    } catch (err) {
      setError("Erro ao carregar as contas.");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    startTransition(async () => {
      try {
        await axios.post("https://webhookn8n.lumibot.com.br/webhook/new/accounts", formData);
        setFormData({
          companyName: "",
          botName: "",
          clientName: "",
          clientEmail: "",
        });
        await fetchAccounts(); // Atualiza a lista após criar uma nova conta
        setShowAddForm(false); // Fecha o formulário após sucesso
      } catch (err) {
        setError("Erro ao criar a conta.");
        console.error(err);
      }
    });
  };

  const handleToggleStatus = async (account: Account) => {
    const newStatus = account.status === 0 ? 1 : 0;
    
    startTransition(async () => {
      try {
        await axios.post("https://webhookn8n.lumibot.com.br/webhook/accounts/status", {
          id: account.id,
          status: newStatus
        });
        
        // Atualiza localmente o status da conta
        setAccounts(accounts.map(acc => 
          acc.id === account.id ? { ...acc, status: newStatus } : acc
        ));
      } catch (err) {
        setError("Erro ao alterar o status da conta.");
        console.error(err);
      }
    });
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gerenciar Contas</h1>
        
        {/* Barra de busca e botão de adicionar */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-md w-64"
          />
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-4 py-2 rounded ${showAddForm ? 'bg-gray-500 text-white' : 'bg-blue-600 text-white'}`}
            disabled={isPending}
          >
            {showAddForm ? 'Cancelar' : 'Adicionar Conta'}
          </button>
        </div>
      </div>
      
      {/* Formulário para adicionar conta (visível apenas quando showAddForm é true) */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Adicionar Nova Conta</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa*
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label htmlFor="botName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Bot*
                </label>
                <input
                  type="text"
                  id="botName"
                  name="botName"
                  value={formData.botName}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente*
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email do Cliente*
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 mr-2"
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isPending}
              >
                {isPending ? 'Criando...' : 'Criar Conta'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Tabela de contas */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto max-w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bot-Token</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Url-Crm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Criação</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.custom_attributes[1]?.bot || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.custom_attributes[1]?.token || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link target="blank" href={account.custom_attributes[2]?.crm || "-"}>{account.custom_attributes[2]?.crm || "-"}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(account.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        account.status === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {account.status === 0 ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => handleToggleStatus(account)}
                        className={`${
                          account.status === 0 ? 'text-amber-600 hover:text-amber-900' : 'text-green-600 hover:text-green-900'
                        } text-left`}
                        disabled={isPending}
                      >
                        {account.status === 0 ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm ? 'Nenhuma conta encontrada para esta busca' : 'Nenhuma conta criada ainda'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}