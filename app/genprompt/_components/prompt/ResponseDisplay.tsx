import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface ResponseDisplayProps {
  response: string
  isLoading: boolean
}

const ResponseDisplay = ({ response, isLoading }: ResponseDisplayProps) => {
  return (
    <div className="bg-gray-700 text-gray-300 text-sm font-extralight rounded-lg p-6 min-h-[200px] overflow-auto">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-400">Generating response...</span>
        </div>
      ) : response ? (
        <div className="prose prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-100 max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
          >
            {typeof response === 'string' ? response : JSON.stringify(response)}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-500">Sua instrução sera gerada aqui...</span>
        </div>
      )}
    </div>
  )
}

export default ResponseDisplay