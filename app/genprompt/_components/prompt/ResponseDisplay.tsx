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
            components={{
              // Customizações para melhorar a renderização do markdown
              h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-white" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2 text-white" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1 text-white" {...props} />,
              h4: ({ node, ...props }) => <h4 className="text-sm font-bold mt-2 mb-1 text-white" {...props} />,
              p: ({ node, ...props }) => <p className="my-2" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2" {...props} />,
              li: ({ node, ...props }) => <li className="my-1" {...props} />,
              a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
              blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-500 pl-4 italic my-2" {...props} />,
              code: ({ node, inline, ...props } : any )  => 
                inline 
                  ? <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props} />
                  : <code className="block bg-gray-800 p-2 rounded text-sm overflow-x-auto" {...props} />
            }}
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