"""
HeartWise Medical AI Assistant with RAG
Retrieval-Augmented Generation system for context-aware medical responses
"""

import os
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import json
from datetime import datetime

class MedicalRAGService:
    def __init__(self):
        # Initialize Chroma vector database (new API)
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Create or get collections
        self.medical_knowledge = self._get_or_create_collection("medical_knowledge")
        self.ecg_analyses = self._get_or_create_collection("ecg_analyses")
        self.patient_data = self._get_or_create_collection("patient_data")
        
        # Initialize medical knowledge base
        self._initialize_knowledge_base()
    
    def _get_or_create_collection(self, name: str):
        """Get or create a collection in Chroma"""
        try:
            return self.chroma_client.get_collection(name)
        except:
            return self.chroma_client.create_collection(
                name=name,
                metadata={"description": f"Collection for {name}"}
            )
    
    def _initialize_knowledge_base(self):
        """Initialize with medical knowledge"""
        
        # Check if already initialized
        if self.medical_knowledge.count() > 0:
            print(f"✅ Medical knowledge base already loaded ({self.medical_knowledge.count()} documents)")
            return
        
        print("📚 Initializing medical knowledge base...")
        
        medical_docs = [
            {
                "id": "cardiac_conditions_1",
                "content": """Normal Sinus Rhythm: A normal heart rhythm with a heart rate between 60-100 BPM. 
                Regular R-R intervals, normal P waves before each QRS complex. Indicates healthy cardiac function. 
                No treatment needed. Continue regular checkups.""",
                "category": "cardiac_conditions",
                "severity": "normal"
            },
            {
                "id": "cardiac_conditions_2",
                "content": """Atrial Fibrillation (AFib): Irregular, often rapid heart rate. Causes irregular R-R intervals 
                and absence of clear P waves. Increases stroke risk. Requires anticoagulation therapy, rate control 
                medications (beta-blockers), and regular monitoring. High risk condition.""",
                "category": "cardiac_conditions",
                "severity": "high"
            },
            {
                "id": "cardiac_conditions_3",
                "content": """Bradycardia: Heart rate below 60 BPM. Can be normal for athletes or caused by medication, 
                heart disease, or electrolyte imbalances. Monitor symptoms like dizziness, fatigue, shortness of breath. 
                May require pacemaker if symptomatic.""",
                "category": "cardiac_conditions",
                "severity": "medium"
            },
            {
                "id": "cardiac_conditions_4",
                "content": """Tachycardia: Heart rate above 100 BPM at rest. Can be caused by stress, anxiety, fever, 
                dehydration, or heart conditions. Monitor for palpitations, chest pain, shortness of breath. 
                May require medication or lifestyle changes.""",
                "category": "cardiac_conditions",
                "severity": "medium"
            },
            {
                "id": "cardiac_conditions_5",
                "content": """Premature Ventricular Contractions (PVCs): Extra heartbeats originating in ventricles. 
                Appear as wide, bizarre QRS complexes. Usually benign but can indicate underlying heart disease if frequent. 
                Reduce caffeine, manage stress, avoid triggers.""",
                "category": "cardiac_conditions",
                "severity": "medium"
            },
            {
                "id": "medications_1",
                "content": """Beta-blockers (Metoprolol, Atenolol): Slow heart rate, reduce blood pressure, decrease 
                cardiac workload. Used for hypertension, AFib, heart failure, anxiety. Common side effects: fatigue, 
                cold hands/feet, dizziness. Take with food, don't stop abruptly.""",
                "category": "medications",
                "severity": "medium"
            },
            {
                "id": "medications_2",
                "content": """ACE Inhibitors (Lisinopril, Enalapril): Lower blood pressure, reduce heart workload. 
                Used for hypertension, heart failure, post-MI. Side effects: dry cough, dizziness, elevated potassium. 
                Monitor kidney function regularly.""",
                "category": "medications",
                "severity": "medium"
            },
            {
                "id": "medications_3",
                "content": """Anticoagulants (Warfarin, Apixaban): Prevent blood clots. Essential for AFib patients 
                to reduce stroke risk. Requires regular INR monitoring with warfarin. Avoid vitamin K-rich foods. 
                Bleeding risk - avoid falls and injuries.""",
                "category": "medications",
                "severity": "high"
            },
            {
                "id": "diet_1",
                "content": """Heart-Healthy Mediterranean Diet: Rich in fruits, vegetables, whole grains, fish, olive oil, 
                nuts. Low in red meat, processed foods, saturated fats. Reduces cardiovascular risk by 30%. 
                Aim for 5+ servings of vegetables, 2-3 servings of fish per week, handful of nuts daily.""",
                "category": "diet",
                "severity": "normal"
            },
            {
                "id": "diet_2",
                "content": """Sodium Restriction for Heart Health: Limit to 1500-2000mg per day for heart disease patients. 
                Reduces blood pressure, prevents fluid retention. Avoid processed foods, canned soups, deli meats, 
                frozen dinners. Use herbs and spices instead of salt.""",
                "category": "diet",
                "severity": "high"
            },
            {
                "id": "lifestyle_1",
                "content": """Exercise for Heart Health: 150 minutes of moderate aerobic activity per week. Walking, 
                swimming, cycling improve cardiovascular fitness. Start slowly, gradually increase intensity. 
                Monitor heart rate during exercise. Stop if chest pain, severe shortness of breath, dizziness occurs.""",
                "category": "lifestyle",
                "severity": "normal"
            },
            {
                "id": "lifestyle_2",
                "content": """Stress Management for Cardiac Health: Chronic stress increases heart disease risk. 
                Practice meditation, deep breathing, yoga. Get adequate sleep (7-9 hours). Maintain social connections. 
                Consider counseling if needed. Stress can trigger arrhythmias and blood pressure spikes.""",
                "category": "lifestyle",
                "severity": "medium"
            },
            {
                "id": "hrv_1",
                "content": """Heart Rate Variability (HRV): Variation in time between heartbeats. High HRV indicates 
                good cardiovascular fitness and autonomic balance. Low HRV associated with stress, poor fitness, 
                increased cardiac risk. SDNN > 50ms is healthy. RMSSD > 20ms indicates good parasympathetic tone.""",
                "category": "metrics",
                "severity": "normal"
            },
            {
                "id": "emergency_1",
                "content": """Heart Attack Warning Signs: Chest pain/pressure, pain radiating to arm/jaw/back, 
                shortness of breath, nausea, cold sweat, lightheadedness. Call 911 immediately. Take aspirin if available. 
                Don't drive yourself. Time is critical - every minute matters.""",
                "category": "emergency",
                "severity": "critical"
            },
            {
                "id": "emergency_2",
                "content": """Stroke Warning Signs (FAST): Face drooping, Arm weakness, Speech difficulty, Time to call 911. 
                Also: sudden confusion, trouble seeing, severe headache, loss of balance. AFib patients at higher risk. 
                Act fast - treatment within 3 hours critical.""",
                "category": "emergency",
                "severity": "critical"
            }
        ]
        
        # Add documents to collection
        for doc in medical_docs:
            embedding = self.embedding_model.encode(doc["content"]).tolist()
            self.medical_knowledge.add(
                documents=[doc["content"]],
                embeddings=[embedding],
                ids=[doc["id"]],
                metadatas=[{
                    "category": doc["category"],
                    "severity": doc["severity"]
                }]
            )
        
        print(f"✅ Loaded {len(medical_docs)} medical documents into knowledge base")
    
    def add_ecg_analysis(self, session_id: str, analysis_data: Dict[str, Any]):
        """Add ECG analysis to vector database for future retrieval"""
        
        # Create searchable text from analysis
        content = f"""
        ECG Analysis Session {session_id}:
        Classification: {analysis_data.get('classification', 'Unknown')}
        Confidence: {analysis_data.get('confidence', 0)}%
        Heart Rate: {analysis_data.get('heart_rate', 0)} BPM
        Risk Level: {analysis_data.get('risk_level', 'Unknown')}
        HRV Metrics: SDNN={analysis_data.get('hrv_sdnn', 0)}ms, RMSSD={analysis_data.get('hrv_rmssd', 0)}ms
        Abnormalities: {', '.join(analysis_data.get('abnormalities', []))}
        Timestamp: {analysis_data.get('timestamp', datetime.now().isoformat())}
        """
        
        embedding = self.embedding_model.encode(content).tolist()
        
        self.ecg_analyses.add(
            documents=[content],
            embeddings=[embedding],
            ids=[f"ecg_{session_id}"],
            metadatas=[{
                "session_id": session_id,
                "classification": analysis_data.get('classification', ''),
                "risk_level": analysis_data.get('risk_level', ''),
                "timestamp": analysis_data.get('timestamp', '')
            }]
        )
        
        print(f"✅ Added ECG analysis {session_id} to vector database")
    
    def add_patient_context(self, user_id: str, context: Dict[str, Any]):
        """Add patient medical history and context"""
        
        content = f"""
        Patient Profile {user_id}:
        Medical Conditions: {', '.join(context.get('conditions', []))}
        Current Medications: {', '.join(context.get('medications', []))}
        Allergies: {', '.join(context.get('allergies', []))}
        Age: {context.get('age', 'Unknown')}
        Recent ECG Results: {context.get('recent_ecg', 'None')}
        Risk Factors: {', '.join(context.get('risk_factors', []))}
        """
        
        embedding = self.embedding_model.encode(content).tolist()
        
        try:
            # Update if exists, add if not
            self.patient_data.upsert(
                documents=[content],
                embeddings=[embedding],
                ids=[f"patient_{user_id}"],
                metadatas=[{
                    "user_id": user_id,
                    "updated": datetime.now().isoformat()
                }]
            )
        except:
            self.patient_data.add(
                documents=[content],
                embeddings=[embedding],
                ids=[f"patient_{user_id}"],
                metadatas=[{
                    "user_id": user_id,
                    "updated": datetime.now().isoformat()
                }]
            )
        
        print(f"✅ Updated patient context for {user_id}")
    
    def search_context(self, query: str, n_results: int = 5) -> Dict[str, Any]:
        """Search across all collections for relevant context"""
        
        query_embedding = self.embedding_model.encode(query).tolist()
        
        results = {
            "medical_knowledge": [],
            "ecg_analyses": [],
            "patient_data": []
        }
        
        # Search medical knowledge
        if self.medical_knowledge.count() > 0:
            med_results = self.medical_knowledge.query(
                query_embeddings=[query_embedding],
                n_results=min(n_results, self.medical_knowledge.count())
            )
            results["medical_knowledge"] = self._format_results(med_results)
        
        # Search ECG analyses
        if self.ecg_analyses.count() > 0:
            ecg_results = self.ecg_analyses.query(
                query_embeddings=[query_embedding],
                n_results=min(n_results, self.ecg_analyses.count())
            )
            results["ecg_analyses"] = self._format_results(ecg_results)
        
        # Search patient data
        if self.patient_data.count() > 0:
            patient_results = self.patient_data.query(
                query_embeddings=[query_embedding],
                n_results=min(n_results, self.patient_data.count())
            )
            results["patient_data"] = self._format_results(patient_results)
        
        return results
    
    def _format_results(self, results: Dict) -> List[Dict]:
        """Format Chroma results to list of dicts"""
        formatted = []
        
        if not results or not results.get('documents'):
            return formatted
        
        documents = results['documents'][0] if results['documents'] else []
        metadatas = results['metadatas'][0] if results.get('metadatas') else []
        distances = results['distances'][0] if results.get('distances') else []
        
        for i, doc in enumerate(documents):
            formatted.append({
                "content": doc,
                "metadata": metadatas[i] if i < len(metadatas) else {},
                "relevance_score": 1 - distances[i] if i < len(distances) else 0
            })
        
        return formatted
    
    def get_augmented_context(self, query: str, user_id: str = None) -> str:
        """Get augmented context for LLM prompt"""
        
        results = self.search_context(query, n_results=3)
        
        context_parts = []
        
        # Add relevant medical knowledge
        if results["medical_knowledge"]:
            context_parts.append("## Relevant Medical Knowledge:")
            for i, result in enumerate(results["medical_knowledge"][:3], 1):
                context_parts.append(f"{i}. {result['content']}")
        
        # Add relevant ECG analyses
        if results["ecg_analyses"]:
            context_parts.append("\n## Recent ECG Analyses:")
            for i, result in enumerate(results["ecg_analyses"][:2], 1):
                context_parts.append(f"{i}. {result['content']}")
        
        # Add patient context if user_id provided
        if user_id and results["patient_data"]:
            context_parts.append("\n## Patient Context:")
            for result in results["patient_data"][:1]:
                context_parts.append(result['content'])
        
        return "\n".join(context_parts) if context_parts else "No relevant context found."
    
    def get_stats(self) -> Dict[str, int]:
        """Get statistics about the knowledge base"""
        return {
            "medical_knowledge": self.medical_knowledge.count(),
            "ecg_analyses": self.ecg_analyses.count(),
            "patient_data": self.patient_data.count(),
            "total_documents": (
                self.medical_knowledge.count() + 
                self.ecg_analyses.count() + 
                self.patient_data.count()
            )
        }


# Singleton instance
_rag_service = None

def get_rag_service() -> MedicalRAGService:
    """Get or create RAG service instance"""
    global _rag_service
    if _rag_service is None:
        _rag_service = MedicalRAGService()
    return _rag_service


if __name__ == "__main__":
    # Test the RAG service
    print("🧪 Testing Medical RAG Service...")
    
    rag = MedicalRAGService()
    
    # Test search
    query = "What should I do about irregular heartbeat?"
    print(f"\n📝 Query: {query}")
    
    context = rag.get_augmented_context(query)
    print(f"\n🔍 Retrieved Context:\n{context}")
    
    # Test stats
    stats = rag.get_stats()
    print(f"\n📊 Knowledge Base Stats:")
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    print("\n✅ RAG Service initialized successfully!")
