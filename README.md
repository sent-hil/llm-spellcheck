# llm-spellcheck
First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3003](http://localhost:3003) with your browser to see the result.

## Docker
```
docker build -t llm-spellcheck .
docker run -d -p 3003:3003 -e OPENAI_API_KEY=$OPENAI_API_KEY llm-spellcheck:latest
```
