# Profile RAG

1. Edit `data/profile.md` (replace sample values).
2. `pip install -r requirements.txt`
3. `python ingest.py`          -> creates `index/vectors.npy` and `index/chunks.json`
4. Copy `.env.example` to `.env` and put your Groq key in it (get one at console.groq.com/keys)
5. `streamlit run app.py`

## Deploy (free): Streamlit Community Cloud
- Push this folder to a GitHub repo (commit the `index/` folder too).
- share.streamlit.io -> New app -> pick repo, main file `app.py`.
- Advanced settings -> Secrets: GROQ_API_KEY = "gsk_..."
- Re-run `python ingest.py` and push whenever you change profile.md.
