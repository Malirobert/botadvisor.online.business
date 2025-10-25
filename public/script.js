const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const wordCounter = document.getElementById('word-counter');

let userMessage = null;
let showThinkingMessageCalled = false;
const inputInitHeight = chatInput.scrollHeight;

// Gestion du comptage des mots
chatInput.addEventListener("input", () => {
    const words = chatInput.value.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    wordCounter.textContent = `${wordCount}/150`;

    if (wordCount > 150) {
        wordCounter.classList.add('exceeded');
        sendChatBtn.classList.add('disabled');
    } else {
        wordCounter.classList.remove('exceeded');
        sendChatBtn.classList.remove('disabled');
    }

    chatInput.style.height = `${inputInitHeight}px`; // Réinitialiser la hauteur
    chatInput.style.height = `${chatInput.scrollHeight}px`; // Ajuster la hauteur du textarea
});

// Fonction pour créer des éléments de chat
const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
}

// Fonction pour afficher le message "Thinking..." avant de répondre
const showThinkingMessageAndReveal = () => {
    if (showThinkingMessageCalled) return;
    showThinkingMessageCalled = true;

    const firstMessage = document.getElementById('firstMessage');
    const thinkingMessage = document.getElementById('thinkingMessage');

    thinkingMessage.style.display = 'block';
    firstMessage.style.display = 'none';

    setTimeout(() => {
        thinkingMessage.style.display = 'none';
        firstMessage.style.display = 'block';
    }, 3000); // 3 secondes
}

// Fonction pour sauvegarder les messages dans le localStorage
function saveMessageToLocalStorage(role, message) {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.push({ role, message, timestamp: new Date().toISOString() });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Fonction pour charger l'historique au démarrage
function loadChatHistory() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.forEach(item => {
        const li = createChatLi(item.message, item.role === 'user' ? 'outgoing' : 'incoming');
        chatbox.appendChild(li);
    });
    chatbox.scrollTo(0, chatbox.scrollHeight);
}

// Appeler au chargement de la page
window.addEventListener('DOMContentLoaded', loadChatHistory);

// Fonction pour générer la réponse
const generateResponse = () => {
    userMessage = chatInput.value.trim();
    if (!userMessage) return;

    saveMessageToLocalStorage('user', userMessage); // Sauvegarde du message utilisateur
    chatInput.value = ""; // Réinitialiser le champ de saisie
    chatInput.style.height = `${inputInitHeight}px`; // Réinitialiser la hauteur du textarea

    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
        const thinkingMessageLi = createChatLi("Thinking...", "incoming");
        chatbox.appendChild(thinkingMessageLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);

      fetch("https://botadvisor-online-business.onrender.com/api/chat", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: userMessage })
})
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        }).then(data => {
            const responseMessage = Array.isArray(data.message) && data.message.length > 0
                ? data.message.map(msg => typeof msg === 'object' ? msg.text.content : msg).join(' ')
                : data.message || "No response";

            setTimeout(() => {
                thinkingMessageLi.remove(); // Supprime le message "Thinking..."
                const responseLi = createChatLi(responseMessage, "incoming");
                chatbox.appendChild(responseLi);
                saveMessageToLocalStorage('bot', responseMessage); // Sauvegarde de la réponse du bot

                // Ajouter un message d'affiliation si nécessaire
                if (responseMessage && responseMessage.trim() !== "No response") {
                    const affiliateMessage = document.createElement("li");
                    affiliateMessage.id = 'links';
                    affiliateMessage.classList.add("chat", "incoming");
                    affiliateMessage.innerHTML = `
                        <span class="material-symbols-outlined">smart_toy</span>      
                        <p style="color:red; font-weight: bolder;">
                        <br>Launch your online business right away with => <a href="https://onlinebusinessbuilderchallenge.com/get-started/enroll?aid=100558" target="_blank">Legendary Marketer</a>
                        <br>A profitable online business gives you true financial freedom — the power to earn on your own terms, work from anywhere, and finally escape the 9-to-5 grind. Build a life where unpaid bills and strict schedules are replaced by flexibility, independence, and unlimited potential.
                        </p>
                    `;
                    chatbox.appendChild(affiliateMessage);
                }

                chatbox.scrollTo(0, chatbox.scrollHeight);
            }, 3000); // Délai de 3 secondes avant d'afficher la réponse
        })
        .catch((error) => {
            console.error('Error:', error);
            const errorMessage = "Oops! An error occurred. Please try again.";
            const errorLi = createChatLi(errorMessage, "incoming");

            thinkingMessageLi.remove(); // Supprime le message "Thinking..."
            chatbox.appendChild(errorLi);
        })
        .finally(() => {
            chatbox.scrollTo(0, chatbox.scrollHeight);
        });
    }, 1000); // Délai de 1 seconde avant d'afficher "Thinking..."
}

// Gestion de l'événement de "click" pour envoyer un message
sendChatBtn.addEventListener("click", (e) => {
    const words = chatInput.value.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length > 150) {
        e.preventDefault(); // Empêche l'envoi si la limite de mots est dépassée
    } else {
        generateResponse(); // Appelle la fonction pour générer la réponse
    }
});

// Fonction pour afficher/masquer le chatbot en fonction de la taille de l'écran
const fromOnToOff = () => {
    if (window.innerWidth <= 1140) {
        document.querySelector(".leftContent").style.display = "none";
    }
}

const fromOffToOn = () => {
    if (window.innerWidth <= 1140) {
        document.querySelector(".leftContent").style.display = "flex";
    }
}

// Ouvrir automatiquement le chatbot après 6 secondes
const openChatbotAfterDelay = () => {
    setTimeout(() => {
        if (!document.body.classList.contains("show-chatbot")) {
            chatbotToggler.click(); // Simule un clic pour ouvrir le chatbot
        }
    }, 6000); // 6 secondes
}

// Event listeners pour l'UI
chatbotToggler.addEventListener("click", () => {
    document.body.classList.toggle("show-chatbot");
    showThinkingMessageAndReveal();
});
chatbotToggler.addEventListener("click", fromOnToOff);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
closeBtn.addEventListener("click", fromOffToOn);

// Lancer l'ouverture automatique du chatbot
openChatbotAfterDelay();
