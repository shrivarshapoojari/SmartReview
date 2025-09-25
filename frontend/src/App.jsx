import { useState } from 'react'
import './App.css'

function App() {
  const [repo, setRepo] = useState('')
  const [prNumber, setPrNumber] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!repo || !prNumber) return
    setLoading(true)
    // Mock API call - replace with actual backend call
    setTimeout(() => {
      setAnalysis({
        summary: "Code review completed",
        security: ["No critical vulnerabilities found"],
        bugs: ["Potential null pointer in line 45"],
        performance: ["Consider optimizing loop in function X"],
        quality: ["Good code structure overall"]
      })
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="app">
      <h1>Smart Code Review Agent</h1>
      <div className="input-section">
        <input
          type="text"
          placeholder="GitHub Repo (owner/repo)"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
        />
        <input
          type="number"
          placeholder="PR Number"
          value={prNumber}
          onChange={(e) => setPrNumber(e.target.value)}
        />
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze PR'}
        </button>
      </div>
      {analysis && (
        <div className="results">
          <h2>Analysis Results</h2>
          <div className="section">
            <h3>Summary</h3>
            <p>{analysis.summary}</p>
          </div>
          <div className="section">
            <h3>Security Issues</h3>
            <ul>
              {analysis.security.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <div className="section">
            <h3>Bugs</h3>
            <ul>
              {analysis.bugs.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <div className="section">
            <h3>Performance</h3>
            <ul>
              {analysis.performance.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
          <div className="section">
            <h3>Code Quality</h3>
            <ul>
              {analysis.quality.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
