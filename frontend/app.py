import streamlit as st
import requests
from PIL import Image
import io
import os

# Page configuration
st.set_page_config(
    page_title="Diabetic Retinopathy Detection",
    page_icon="👁️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# API configuration
API_URL = "http://localhost:8000"

# Custom CSS for better styling
st.markdown("""
    <style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        color: #1E88E5;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #666;
        text-align: center;
        margin-bottom: 2rem;
    }
    .result-box {
        padding: 1.5rem;
        border-radius: 10px;
        background-color: #f0f2f6;
        margin: 1rem 0;
    }
    .diagnosis-text {
        font-size: 2rem;
        font-weight: bold;
        color: #1E88E5;
    }
    .confidence-text {
        font-size: 1.5rem;
        color: #4CAF50;
    }
    .stProgress > div > div > div > div {
        background-color: #1E88E5;
    }
    </style>
""", unsafe_allow_html=True)

# Header
st.markdown('<div class="main-header">👁️ Diabetic Retinopathy Detection</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">AI-Powered Retinal Image Analysis</div>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.header("ℹ️ About")
    st.info("""
    This application uses a **ResNet50** deep learning model trained on the APTOS dataset 
    to detect diabetic retinopathy from retinal images.
    
    **Disease Stages:**
    - 🟢 **No DR**: No Diabetic Retinopathy
    - 🟡 **Mild**: Mild NPDR
    - 🟠 **Moderate**: Moderate NPDR
    - 🔴 **Severe**: Severe NPDR
    - ⚫ **Proliferative**: PDR
    """)
    
    st.header("🔧 API Status")
    
    # Check API health
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            st.success("✅ API is running")
            st.json(health_data)
        else:
            st.error("❌ API is not responding")
    except Exception as e:
        st.error(f"❌ Cannot connect to API\n\n{str(e)}")
        st.warning("Make sure the FastAPI server is running:\n```bash\ncd backend\npython main.py\n```")

# Main content
col1, col2 = st.columns([1, 1])

with col1:
    st.header("📤 Upload Retinal Image")
    
    # File uploader
    uploaded_file = st.file_uploader(
        "Choose a retinal image...",
        type=["jpg", "jpeg", "png"],
        help="Upload a fundus photograph of the retina"
    )
    
    if uploaded_file is not None:
        # Display uploaded image
        image = Image.open(uploaded_file)
        st.image(image, caption="Uploaded Image", use_column_width=True)
        
        # Predict button
        if st.button("🔍 Analyze Image", type="primary"):
            with st.spinner("🧠 Analyzing retinal image..."):
                try:
                    # Prepare file for upload
                    uploaded_file.seek(0)
                    files = {"file": (uploaded_file.name, uploaded_file, uploaded_file.type)}
                    
                    # Make prediction request
                    response = requests.post(f"{API_URL}/predict", files=files)
                    
                    if response.status_code == 200:
                        result = response.json()
                        
                        # Store result in session state
                        st.session_state.result = result
                        st.session_state.uploaded_filename = uploaded_file.name
                        st.success("✅ Analysis complete!")
                        
                        # Show validation message if available
                        if result.get('validation_message'):
                            st.info(f"✓ {result['validation_message']}")
                    elif response.status_code == 400:
                        # Validation error (not a retinal image)
                        error_detail = response.json().get('detail', 'Invalid image')
                        
                        # Display prominent warning
                        st.warning(f"### ⚠️ {error_detail}")
                        
                        st.info("""
                        **What is a retinal fundus image?**
                        
                        A retinal fundus image is a photograph of the back of your eye, showing:
                        - 👁️ The retina (inner surface of the eye)
                        - 🔴 Blood vessels
                        - 🟡 Optic disc (where the optic nerve connects)
                        - ⚫ Macula (central area for sharp vision)
                        
                        **Characteristics of valid retinal images:**
                        - Circular field of view
                        - Reddish/orange coloring
                        - Visible blood vessel network
                        - Taken with specialized fundus camera
                        
                        **This system will NOT work with:**
                        - ❌ Regular photos
                        - ❌ Screenshots
                        - ❌ Drawings or illustrations
                        - ❌ Other medical images (X-rays, CT scans, etc.)
                        """)
                    else:
                        st.error(f"❌ Error: {response.json().get('detail', 'Unknown error')}")
                
                except Exception as e:
                    st.error(f"❌ Error connecting to API: {str(e)}")

with col2:
    st.header("📊 Results")
    
    if 'result' in st.session_state:
        result = st.session_state.result
        
        # Display diagnosis
        st.markdown('<div class="result-box">', unsafe_allow_html=True)
        
        diagnosis = result['diagnosis']
        confidence = result['confidence']
        
        # Diagnosis with emoji
        emoji_map = {
            "No DR": "🟢",
            "Mild": "🟡",
            "Moderate": "🟠",
            "Severe": "🔴",
            "Proliferative": "⚫"
        }
        
        st.markdown(
            f'<div class="diagnosis-text">{emoji_map.get(diagnosis, "👁️")} {diagnosis}</div>',
            unsafe_allow_html=True
        )
        st.markdown(
            f'<div class="confidence-text">Confidence: {confidence}%</div>',
            unsafe_allow_html=True
        )
        st.markdown('</div>', unsafe_allow_html=True)
        
        # Confidence meter
        st.progress(confidence / 100)
        
        # All class probabilities
        st.subheader("📈 Class Probabilities")
        probs = result['class_probabilities']
        
        for class_name, prob in probs.items():
            col_a, col_b = st.columns([3, 1])
            with col_a:
                st.text(f"{emoji_map.get(class_name, '•')} {class_name}")
            with col_b:
                st.text(f"{prob:.2f}%")
            st.progress(prob / 100)
        
        # Heatmap section
        st.subheader("🔥 Attention Heatmap")
        
        if result.get('heatmap_available'):
            try:
                heatmap_filename = result['heatmap_filename']
                heatmap_response = requests.get(f"{API_URL}/heatmap/{heatmap_filename}")
                
                if heatmap_response.status_code == 200:
                    heatmap_image = Image.open(io.BytesIO(heatmap_response.content))
                    st.image(heatmap_image, caption="GradCAM Heatmap - Areas of Focus", use_column_width=True)
                    st.info("🔍 The heatmap shows which areas of the retina the AI focused on for its prediction.")
                else:
                    st.warning("⚠️ Heatmap not available")
            except Exception as e:
                st.error(f"❌ Error loading heatmap: {str(e)}")
        else:
            st.warning("⚠️ Heatmap generation failed")
    
    else:
        st.info("👈 Upload an image to see results")

# Footer
st.markdown("---")
st.markdown("""
    <div style="text-align: center; color: #666;">
        <p>🏥 <strong>Medical Disclaimer:</strong> This tool is for educational purposes only. 
        Always consult healthcare professionals for medical diagnosis.</p>
    </div>
""", unsafe_allow_html=True)

# Additional features in sidebar
with st.sidebar:
    st.header("📚 Disease Classes")
    
    # Get classes from API
    try:
        classes_response = requests.get(f"{API_URL}/classes", timeout=5)
        if classes_response.status_code == 200:
            classes_data = classes_response.json()
            descriptions = classes_data.get('descriptions', {})
            
            for class_name, description in descriptions.items():
                with st.expander(f"{emoji_map.get(class_name, '•')} {class_name}"):
                    st.write(description)
    except:
        pass
