document.addEventListener("DOMContentLoaded", () => {
    const messagesContainer = document.getElementById("chat-messages");
    const inputField = document.getElementById("chat-input");
    const sendButton = document.getElementById("send-btn");
    const typingIndicator = document.getElementById("typing-indicator");
    const stageTitle = document.getElementById("stage-title");
    const modal = document.getElementById("results-modal");
    const jsonResults = document.getElementById("json-results");

    let isWaiting = false;

    // Helper syntax bold formatter and line break handler
    function formatMessageText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\n/g, '<br>');
    }

    function appendMessage(sender, text) {
        const msgWrapper = document.createElement("div");
        msgWrapper.className = `message ${sender}`;
        msgWrapper.innerHTML = formatMessageText(text);
        
        messagesContainer.appendChild(msgWrapper);
        smoothScrollToBottom();
    }

    function smoothScrollToBottom() {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: "smooth"
        });
    }

    function setTyping(state) {
        typingIndicator.style.display = state ? "block" : "none";
        isWaiting = state;
        inputField.disabled = state;
        sendButton.disabled = state;
        
        if (state) {
            smoothScrollToBottom();
        } else {
            inputField.focus();
        }
    }

    async function initChat() {
        setTyping(true);
        try {
            const res = await fetch('/api/init', { method: 'POST' });
            const data = await res.json();
            
            if (data.stage_title) {
                stageTitle.textContent = data.stage_title;
            } else {
                stageTitle.textContent = "Yakuniy bosqich";
            }
            
            appendMessage('bot', data.bot_message);
            
            if (data.status === 'completed') {
                inputField.disabled = true;
                sendButton.disabled = true;
                showModal(data.answers);
            }
        } catch (err) {
            console.error(err);
            appendMessage('bot', "Serverga bog'lanishda xatolik yuz berdi. Orqa fon dasturi ishlayotganiga ishonch hosil qiling.");
            stageTitle.textContent = "Tarmoq xatosi";
        }
        setTyping(false);
    }

    function showModal(answersObj) {
        inputField.parentElement.style.opacity = '0';
        inputField.parentElement.style.pointerEvents = 'none';
        
        // Show modal after a small delay
        setTimeout(() => {
            jsonResults.textContent = JSON.stringify(answersObj, null, 2);
            modal.classList.add('active');
        }, 1500);
    }

    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text || isWaiting) return;

        appendMessage('user', text);
        inputField.value = '';
        
        setTyping(true);
        try {
            const res = await fetch('/api/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();
            
            if (data.stage_title) {
                stageTitle.textContent = data.stage_title;
            }
            
            appendMessage('bot', data.bot_message);
            
            if (data.status === 'completed') {
                showModal(data.answers);
            }
        } catch (err) {
            console.error(err);
            appendMessage('bot', "Kechirasiz, serverdan javob olishda uzilish ro'y berdi.");
        }
        setTyping(false);
    }

    sendButton.addEventListener("click", sendMessage);
    
    inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // Start fetching the first message
    initChat();
});
