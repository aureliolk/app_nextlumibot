import { format } from 'date-fns'

interface PromptHistoryItem {
  id: string
  account_id: string
  prompt: string
  created_at: string
  analysis?: string
  prompt_created?: string
  prompt_removed?: string
  prompt_complete?: string
  quality_checks?: string[]
}

interface PromptHistoryProps {
  prompts: PromptHistoryItem[]
  currentPromptId: string | null
  isSettingCurrent: boolean
  onRestore: (promptId: string) => Promise<void>
  onSetCurrent: (promptId: string) => Promise<void>
}

const PromptHistory = ({
  prompts,
  currentPromptId,
  isSettingCurrent,
  onRestore,
  onSetCurrent
}: PromptHistoryProps) => {
  return (
    <div className="mb-6 bg-gray-700 rounded-lg overflow-hidden">
      <div className="p-3 bg-gray-600 border-b border-gray-500">
        <h3 className="text-sm font-medium text-white">Histórico de Instruções</h3>
        <p className="text-xs text-gray-300 mt-1">Clique para restaurar ou defina como atual</p>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {prompts.length > 0 ? (
          <ul className="divide-y divide-gray-600">
            {prompts.map((item) => (
              <li
                key={item.id}
                className={`p-3 hover:bg-gray-600 transition-colors ${currentPromptId === item.id ? 'bg-gray-650 border-l-4 border-orange-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <button
                    onClick={() => onRestore(item.id)}
                    className="flex-1 text-left pr-4"
                  >
                    <div>
                      <p className="text-xs font-medium text-white line-clamp-2">
                        {item.prompt?.substring(0, 150)}
                        {item.prompt?.length > 150 ? '...' : ''}
                      </p>
                      {currentPromptId === item.id && (
                        <span className="text-xs text-orange-400 mt-1">Prompt atual</span>
                      )}
                    </div>
                  </button>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-400 whitespace-nowrap mb-1">
                      {item.created_at ? format(new Date(item.created_at), 'dd/MM/yy HH:mm') : '-'}
                    </span>
                    <button
                      onClick={() => onSetCurrent(item.id)}
                      disabled={isSettingCurrent || currentPromptId === item.id}
                      className={`text-xs px-2 py-0.5 rounded ${currentPromptId === item.id
                        ? 'bg-orange-600 text-white cursor-default'
                        : 'bg-gray-500 hover:bg-orange-600 text-white'
                      }`}
                      title={currentPromptId === item.id ? 'Este é o prompt atual' : 'Definir como prompt atual'}
                    >
                      {isSettingCurrent && currentPromptId !== item.id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Definindo...</span>
                        </span>
                      ) : currentPromptId === item.id ? (
                        'Atual'
                      ) : (
                        'Definir como atual'
                      )}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-400 text-sm">
            Nenhuma instrução no histórico
          </div>
        )}
      </div>
    </div>
  )
}

export default PromptHistory