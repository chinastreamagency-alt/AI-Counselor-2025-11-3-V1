'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function TestLoginPage() {
  const searchParams = useSearchParams()
  const [logs, setLogs] = useState<string[]>([])
  const [userData, setUserData] = useState<any>(null)

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addLog('=== 测试页面加载 ===')
    addLog(`当前URL: ${window.location.href}`)
    addLog(`URL参数: ${window.location.search}`)
    
    const params = {
      login: searchParams.get('login'),
      email: searchParams.get('email'),
      name: searchParams.get('name'),
      picture: searchParams.get('picture'),
      userId: searchParams.get('userId'),
    }
    
    addLog(`解析的参数: ${JSON.stringify(params, null, 2)}`)
    
    if (params.login === 'success' && params.email && params.userId) {
      addLog('✅ 检测到有效的登录参数')
      
      const user = {
        id: params.userId,
        email: params.email,
        name: params.name || params.email.split('@')[0],
        image: params.picture || '',
        provider: 'google'
      }
      
      setUserData(user)
      addLog(`用户数据: ${JSON.stringify(user, null, 2)}`)
      
      // 测试 localStorage
      try {
        localStorage.setItem('test_user', JSON.stringify(user))
        addLog('✅ localStorage 写入成功')
        
        const retrieved = localStorage.getItem('test_user')
        if (retrieved) {
          addLog('✅ localStorage 读取成功')
        } else {
          addLog('❌ localStorage 读取失败')
        }
      } catch (error) {
        addLog(`❌ localStorage 错误: ${error}`)
      }
    } else {
      addLog('❌ 缺少必要的登录参数')
      if (params.login === 'success') {
        addLog(`  - 有email: ${!!params.email}`)
        addLog(`  - 有userId: ${!!params.userId}`)
      }
    }
    
    // 检查 localStorage 中现有的用户数据
    try {
      const existingUser = localStorage.getItem('user')
      if (existingUser) {
        addLog(`现有用户数据: ${existingUser}`)
      } else {
        addLog('localStorage中无现有用户数据')
      }
    } catch (error) {
      addLog(`读取现有用户数据失败: ${error}`)
    }
  }, [searchParams])

  const testGoogleLogin = () => {
    addLog('=== 开始测试Google登录 ===')
    window.location.href = '/api/auth/custom-google/login'
  }

  const clearStorage = () => {
    localStorage.clear()
    addLog('✅ 已清除 localStorage')
    setUserData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            🔍 Google登录调试页面
          </h1>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={testGoogleLogin}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              测试Google登录
            </button>
            
            <button
              onClick={clearStorage}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              清除存储
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              返回主页
            </button>
          </div>

          {userData && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-bold mb-2 text-green-800">✅ 用户数据</h2>
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-bold mb-3 text-gray-800">📋 日志记录</h2>
            <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded ${
                    log.includes('✅') ? 'bg-green-100 text-green-800' :
                    log.includes('❌') ? 'bg-red-100 text-red-800' :
                    log.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
                    log.includes('===') ? 'bg-blue-100 text-blue-800 font-bold' :
                    'bg-white text-gray-700'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">📱 iOS Safari调试说明</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>清除Safari浏览器缓存和Cookie</li>
            <li>点击"测试Google登录"按钮</li>
            <li>完成Google授权</li>
            <li>返回此页面后，查看日志和用户数据</li>
            <li>如果成功，点击"返回主页"测试实际应用</li>
          </ol>
          
          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <p className="text-xs text-gray-600">
              <strong>提示：</strong>此页面包含详细的调试信息，可以截图发送给开发者。
              所有日志也会输出到浏览器控制台。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

