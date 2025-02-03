'use client'

import { useState, useEffect } from 'react'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import * as Diff from 'diff'
import { ClipboardIcon } from '@heroicons/react/24/outline'

export default function Home() {
    // Initialize from localStorage if available
    const [systemPrompt, setSystemPrompt] = useState('')
    const [userPrompt, setUserPrompt] = useState('')

    // Load from localStorage on mount
    useEffect(() => {
        const savedSystemPrompt = localStorage.getItem('systemPrompt')
        const savedUserPrompt = localStorage.getItem('userPrompt')
        if (savedSystemPrompt) setSystemPrompt(savedSystemPrompt)
        if (savedUserPrompt) setUserPrompt(savedUserPrompt)
    }, [])


    // Save to localStorage whenever prompts change
    useEffect(() => {
        localStorage.setItem('systemPrompt', systemPrompt)
    }, [systemPrompt])

    useEffect(() => {
        localStorage.setItem('userPrompt', userPrompt)
    }, [userPrompt])


    const [openaiResponse, setOpenaiResponse] = useState('')
    const [claudeResponse, setClaudeResponse] = useState('')
    const [isLoadingOpenAI, setIsLoadingOpenAI] = useState(false)
    const [isLoadingClaude, setIsLoadingClaude] = useState(false)
    const [copyNotificationOpenAI, setCopyNotificationOpenAI] = useState(false)
    const [copyNotificationClaude, setCopyNotificationClaude] = useState(false)

    const copyToClipboard = async (text: string, isOpenAI: boolean) => {
        try {
            await navigator.clipboard.writeText(text)
            if (isOpenAI) {
                setCopyNotificationOpenAI(true)
                setTimeout(() => setCopyNotificationOpenAI(false), 2000)
            } else {
                setCopyNotificationClaude(true)
                setTimeout(() => setCopyNotificationClaude(false), 2000)
            }
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const renderDiff = (original: string, modified: string) => {
        const diff = Diff.diffWords(original, modified)
        return diff.map((part, index) => (
            <span key={index} className={part.added ? 'bg-green-200' : part.removed ? 'bg-red-200' : ''}>
                {part.value}
            </span>
        ))
    }

    const handleOpenAISubmit = async () => {
        const openai = new OpenAI({
            apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
            dangerouslyAllowBrowser: true
        })

        setIsLoadingOpenAI(true)
        try {
            const messages = []
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt })
            }
            messages.push({ role: 'user', content: userPrompt })

            const response = await openai.chat.completions.create({
                model: 'gpt-4',
                messages
            })
            setOpenaiResponse(response.choices[0].message.content || '')
        } catch (error) {
            console.error('OpenAI Error:', error)
        }
        setIsLoadingOpenAI(false)
    }

    const handleClaudeSubmit = async () => {
        const anthropic = new Anthropic({
            apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
            dangerouslyAllowBrowser: true
        })

        setIsLoadingClaude(true)
        try {
            const response = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 1000,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
            })
            setClaudeResponse(response.content[0].text)
        } catch (error) {
            console.error('Claude Error:', error)
        }
        setIsLoadingClaude(false)
    }

    return (
        <main className="flex h-screen">
            <div className="w-1/2 h-full p-4 flex flex-col gap-4">
                <div className="h-1/3">
                    <label className="block text-sm font-medium mb-2">System Prompt</label>
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full h-full p-2 border rounded"
                        placeholder="Enter system prompt..."
                    />
                </div>
                <div className="h-2/3">
                    <label className="block text-sm font-medium mb-2 mt-8">User Prompt</label>
                    <textarea
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        className="w-full h-full p-2 border rounded"
                        placeholder="Enter user prompt..."
                    />
                </div>
            </div>

            <div className="w-1/2 h-full p-4 flex flex-col">
                <div className="flex-1 border p-2 rounded mb-4 overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold">OpenAI Response:</h2>
                            {isLoadingOpenAI && (
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {copyNotificationOpenAI && (
                                <span className="text-sm text-gray-600">Copied!</span>
                            )}
                            {openaiResponse && (
                                <ClipboardIcon
                                    className="w-5 h-5 cursor-pointer hover:text-blue-500"
                                    onClick={() => copyToClipboard(openaiResponse, true)}
                                />
                            )}
                        </div>
                    </div>
                    <div className="whitespace-pre-wrap">
                        {openaiResponse && renderDiff(userPrompt, openaiResponse)}
                    </div>
                </div>

                <div className="flex-1 border p-2 rounded overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold">Claude Response:</h2>
                            {isLoadingClaude && (
                                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {copyNotificationClaude && (
                                <span className="text-sm text-gray-600">Copied!</span>
                            )}
                            {claudeResponse && (
                                <ClipboardIcon
                                    className="w-5 h-5 cursor-pointer hover:text-green-500"
                                    onClick={() => copyToClipboard(claudeResponse, false)}
                                />
                            )}
                        </div>
                    </div>
                    <div className="whitespace-pre-wrap">
                        {claudeResponse && renderDiff(userPrompt, claudeResponse)}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-4 left-4 space-x-4">
                <button
                    onClick={handleOpenAISubmit}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={isLoadingOpenAI}
                >
                    Ask OpenAI
                </button>
                <button
                    onClick={handleClaudeSubmit}
                    className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={isLoadingClaude}
                >
                    Ask Claude
                </button>
            </div>
        </main>
    )
}
