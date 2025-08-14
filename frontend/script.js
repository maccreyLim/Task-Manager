document.addEventListener('DOMContentLoaded', () => {
    const isbnTitleInput = document.getElementById('isbn-title-input');
    const searchButton = document.getElementById('search-button');
    const addNewButton = document.getElementById('add-new-button');
    const resetButton = document.getElementById('reset-data-button');
    const taskList = document.getElementById('task-list');
    const modal = document.getElementById('modal');
    const closeButton = document.querySelector('.close-button');
    const modalTitle = document.getElementById('modal-title');
    const bookInfoDiv = document.getElementById('book-info');
    const taskForm = document.getElementById('task-form');
    const totalPagesInput = document.getElementById('total-pages');
    const corrector1Input = document.getElementById('corrector1');
    const corrector2Input = document.getElementById('corrector2');
    const corrector3Input = document.getElementById('corrector3');
    const transcriberInput = document.getElementById('transcriber');
    const enableTranscriberCheckbox = document.getElementById('enable-transcriber');

    // Progress Update Modal Elements
    const progressUpdateModal = document.getElementById('progress-update-modal');
    const progressUpdateForm = document.getElementById('progress-update-form');
    const progressModalTitle = document.getElementById('progress-modal-title');
    const progressTaskInfo = document.getElementById('progress-task-info');
    const updatePageInput = document.getElementById('update-page-input');
    const updateDatetimeInput = document.getElementById('update-datetime-input');
    const progressModalCloseButton = progressUpdateModal.querySelector('.close-button');

    // Notes Modal Elements
    const notesModal = document.getElementById('notes-modal');
    const notesModalTitle = document.getElementById('notes-modal-title');
    const notesList = document.getElementById('notes-list');
    const noteForm = document.getElementById('note-form');
    const noteIdInput = document.getElementById('note-id');
    const noteAuthorInput = document.getElementById('note-author');
    const noteContentInput = document.getElementById('note-content');
    const notesModalCloseButton = notesModal.querySelector('.close-button');

    const apiKey = 'e080d32c1a94808682a5c4fe268ba6f9e5aedf09c936f44ecb51272e59287233';
            const API_URL = 'http://localhost:3000/books';

    let currentBook = null;
    let tasks = [];
    let currentTaskForUpdate = null;
    let currentTaskForNotes = null;
    let serverStatus = 'unknown'; // 'online', 'offline', 'unknown'

    // 서버 연결 상태 확인
    async function checkServerConnection() {
        try {
            console.log('Checking server connection...');
            const response = await fetch(API_URL, { 
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(5000) // 5초 타임아웃
            });
            
            if (response.ok) {
                serverStatus = 'online';
                console.log('Server is online');
                return true;
            } else {
                serverStatus = 'offline';
                console.log('Server responded but not OK:', response.status);
                return false;
            }
        } catch (error) {
            serverStatus = 'offline';
            console.warn('Server connection failed:', error.message);
            return false;
        }
    }

    // 상태 표시 업데이트
    function updateStatusDisplay() {
        let statusText = '';
        let statusColor = '';
        
        switch(serverStatus) {
            case 'online':
                statusText = '서버 연결됨';
                statusColor = '#4CAF50';
                break;
            case 'offline':
                statusText = '서버 연결 실패';
                statusColor = '#f44336';
                break;
            default:
                statusText = '연결 상태 확인 중...';
                statusColor = '#607d8b';
        }
        
        // 헤더에 상태 표시 추가
        const header = document.querySelector('header h1');
        let statusSpan = document.querySelector('.server-status');
        if (!statusSpan) {
            statusSpan = document.createElement('span');
            statusSpan.className = 'server-status';
            statusSpan.style.fontSize = '0.6em';
            statusSpan.style.marginLeft = '10px';
            statusSpan.style.padding = '2px 8px';
            statusSpan.style.borderRadius = '12px';
            statusSpan.style.backgroundColor = 'rgba(255,255,255,0.2)';
            header.appendChild(statusSpan);
        }
        statusSpan.textContent = statusText;
        statusSpan.style.color = statusColor;
    }

    // 데이터 로드 함수
    async function loadTasks() {
        try {
            console.log('Loading tasks from server...');
            updateStatusDisplay();
            
            const isServerOnline = await checkServerConnection();
            
            if (isServerOnline) {
                const response = await fetch(API_URL);
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                tasks = Array.isArray(data) ? data : [];
                console.log(`Loaded ${tasks.length} tasks from server`);
            } else {
                throw new Error('Server is not available');
            }
            
            updateStatusDisplay();
            renderTasks();
            
        } catch (error) {
            console.error('Error in loadTasks:', error);
            serverStatus = 'offline';
            tasks = [];
            
            // 초기 데이터가 필요한 경우에만 제공
            if (tasks.length === 0) {
                console.log('Loading initial data...');
                const initialData = await loadInitialData();
                tasks = initialData;
                console.log('Initialized with sample data');
            }
            
            updateStatusDisplay();
            renderTasks();
            
            alert('서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.');
        }
    }

    // 초기 데이터 로드 (bookworklist.json의 데이터 사용)
    async function loadInitialData() {
        // 이미 제공된 JSON 데이터를 사용
        const initialTask = {
            "id": 1754960400206,
            "book": {
                "title": "설민석의 삼국지 : 지금, 심플하게 <라이트 에디션>. 1, 답답한 세상, 희망을 꿈꾸다",
                "author": "설민석[1970-] 지은이",
                "publisher": "서울 : 세계사(세계사컨텐츠그룹), 20200624",
                "isbn": "9788933871522",
                "totalPages": null
            },
            "totalPages": 384,
            "stages": {
                "correction1": {
                    "assignedTo": "김희연",
                    "history": [],
                    "status": "pending"
                },
                "correction2": {
                    "assignedTo": "",
                    "history": [],
                    "status": "pending"
                },
                "correction3": {
                    "assignedTo": "",
                    "history": [],
                    "status": "pending"
                },
                "transcription": {
                    "assignedTo": "",
                    "history": [],
                    "status": "not_applicable"
                }
            },
            "currentStage": "correction1"
        };
        
        return [initialTask];
    }

    // 작업 저장/업데이트 함수
    async function saveTask(task, isNewTask = false) {
        try {
            const method = isNewTask ? 'POST' : 'PUT';
            const url = isNewTask ? API_URL : `${API_URL}/${task.id}`;
            
            console.log(`${method} request to:`, url);
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(task),
                signal: AbortSignal.timeout(10000) // 10초 타임아웃
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} ${response.statusText}. ${errorText}`);
            }

            const savedTask = await response.json();
            console.log('Task saved to server:', savedTask);
            
            return savedTask;
            
        } catch (error) {
            console.error('Error saving task:', error);
            serverStatus = 'offline';
            updateStatusDisplay();
            throw error;
        }
    }

    // 작업 삭제 함수
    async function deleteTask(taskId) {
        try {
            const response = await fetch(`${API_URL}/${taskId}`, {
                method: 'DELETE',
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok && response.status !== 404) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            
            console.log('Task deleted from server');
            
            // 로컬 배열에서도 삭제
            const index = tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                tasks.splice(index, 1);
                console.log('Task deleted locally');
            }
            
            renderTasks();
            
        } catch (error) {
            console.error('Error deleting task:', error);
            serverStatus = 'offline';
            updateStatusDisplay();
            alert('작업 삭제에 실패했습니다: ' + error.message);
        }
    }

    // HTML 태그 제거 함수
    function stripHtmlTags(html) {
        if (!html) return '';
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    // 초기 로드
    loadTasks();

    // 점역자 체크박스 이벤트
    enableTranscriberCheckbox.addEventListener('change', () => {
        transcriberInput.disabled = !enableTranscriberCheckbox.checked;
        if (transcriberInput.disabled) {
            transcriberInput.value = '';
        }
    });

    // 모달 열기
    function openModal(title = '신규 도서 등록', book = null) {
        modalTitle.textContent = title;
        bookInfoDiv.innerHTML = '';
        currentBook = book;

        if (book) {
            bookInfoDiv.innerHTML = `
                <p><strong>제목:</strong> ${stripHtmlTags(book.title)}</p>
                <p><strong>저자:</strong> ${stripHtmlTags(book.author) || '정보 없음'}</p>
                <p><strong>출판사:</strong> ${stripHtmlTags(book.publisher) || '정보 없음'}</p>
                <p><strong>ISBN:</strong> ${book.isbn || '정보 없음'}</p>
            `;
        } else {
            bookInfoDiv.innerHTML = `
                <p>검색된 도서 정보가 없습니다. 수동으로 입력해주세요.</p>
                <label for="manual-title">제목:</label>
                <input type="text" id="manual-title" required>
                <label for="manual-author">저자:</label>
                <input type="text" id="manual-author">
                <label for="manual-publisher">출판사:</label>
                <input type="text" id="manual-publisher">
                <label for="manual-isbn">ISBN:</label>
                <input type="text" id="manual-isbn">
            `;
        }

        taskForm.reset();
        enableTranscriberCheckbox.checked = false;
        transcriberInput.disabled = true;
        taskForm.style.display = 'block';
        modal.style.display = 'flex';
    }

    // 모달 닫기
    function closeModal() {
        modal.style.display = 'none';
        taskForm.style.display = 'block';
    }

    // 도서 검색
    async function searchBooks(query) {
        if (apiKey === 'YOUR_API_KEY') {
            alert('국립중앙도서관 API 키를 script.js 파일에 입력해주세요.');
            return;
        }

        const url = `https://www.nl.go.kr/NL/search/openApi/search.do?key=${apiKey}&apiType=json&srchTarget=total&kwd=${encodeURIComponent(query)}`;

        try {
            console.log('Searching books:', query);
            const response = await fetch(url, {
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
                throw new Error(`API 오류: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.result && data.result.length > 0) {
                const book = data.result[0];
                const bookInfo = {
                    title: book.titleInfo || '',
                    author: book.authorInfo || '',
                    publisher: book.pubInfo || '',
                    isbn: book.isbn || '',
                    totalPages: null
                };
                openModal('도서 정보 확인 및 등록', bookInfo);
            } else {
                alert('검색 결과가 없습니다.');
                openModal(); // 수동 입력 모달 열기
            }
        } catch (error) {
            console.error('Error fetching book data:', error);
            alert(`책 정보를 가져오는 데 실패했습니다: ${error.message}`);
            openModal(); // 수동 입력 모달 열기
        }
    }

    // 이벤트 리스너들
    searchButton.addEventListener('click', () => {
        const query = isbnTitleInput.value.trim();
        if (query) {
            searchBooks(query);
        } else {
            alert('ISBN 또는 책 제목을 입력해주세요.');
        }
    });

    // Enter 키로 검색
    isbnTitleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    addNewButton.addEventListener('click', () => {
        openModal();
    });

    resetButton.addEventListener('click', async () => {
        const password = prompt('모든 데이터를 리셋하려면 비밀번호를 입력하세요:');
        if (password === 'maccrey') {
            if (confirm('정말로 모든 작업 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                try {
                    // 각 작업을 개별적으로 삭제
                    const deletePromises = tasks.map(task => 
                        fetch(`${API_URL}/${task.id}`, { method: 'DELETE' })
                            .catch(error => console.error(`Failed to delete task ${task.id}:`, error))
                    );
                    
                    await Promise.all(deletePromises);
                    
                    tasks = [];
                    renderTasks();
                    alert('모든 데이터가 삭제되었습니다.');
                } catch (error) {
                    console.error('Error resetting data:', error);
                    tasks = [];
                    renderTasks();
                    alert('일부 데이터 삭제에 실패했지만 로컬 데이터는 초기화되었습니다.');
                }
            }
        } else if (password !== null) {
            alert('비밀번호가 올바르지 않습니다.');
        }
    });

    closeButton.addEventListener('click', closeModal);

    // 모달 외부 클릭시 닫기
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
        if (event.target === progressUpdateModal) {
            closeProgressUpdateModal();
        }
    });

    // 작업 등록 폼 제출
    taskForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
            const newBook = currentBook || {
                title: document.getElementById('manual-title')?.value.trim() || '',
                author: document.getElementById('manual-author')?.value.trim() || '',
                publisher: document.getElementById('manual-publisher')?.value.trim() || '',
                isbn: document.getElementById('manual-isbn')?.value.trim() || ''
            };

            if (!newBook.title) {
                alert('책 제목은 필수입니다.');
                return;
            }

            const totalPages = parseInt(totalPagesInput.value);
            if (isNaN(totalPages) || totalPages <= 0) {
                alert('올바른 페이지 수를 입력해주세요.');
                return;
            }

            const corrector1 = corrector1Input.value.trim();
            if (!corrector1) {
                alert('1차 교정자는 필수입니다.');
                return;
            }

            const corrector2 = corrector2Input.value.trim();
            const corrector3 = corrector3Input.value.trim();
            const transcriber = transcriberInput.value.trim();
            const isTranscriberEnabled = enableTranscriberCheckbox.checked;

            const newTask = {
                id: Date.now().toString(), // ID를 문자열로 생성
                book: newBook,
                totalPages: totalPages,
                stages: {
                    correction1: { assignedTo: corrector1, history: [], status: 'pending' },
                    correction2: { assignedTo: corrector2, history: [], status: 'pending' },
                    correction3: { assignedTo: corrector3, history: [], status: 'pending' },
                    transcription: { assignedTo: transcriber, history: [], status: isTranscriberEnabled && transcriber ? 'pending' : 'not_applicable' }
                },
                currentStage: 'correction1'
            };

            console.log('Creating new task:', newTask);
            
            const savedTask = await saveTask(newTask, true);
            
            // 로컬 배열에 새 작업 추가
            tasks.push(savedTask);

            renderTasks();
            closeModal();
            
            alert('새 작업이 등록되었습니다.');
            
        } catch (error) {
            console.error('Error adding task:', error);
            alert(`작업을 추가하는 데 실패했습니다: ${error.message}`);
        }
    });

    // 작업 목록 렌더링
    function renderTasks() {
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            taskList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">등록된 작업이 없습니다.</p>';
            return;
        }
        
        tasks.sort((a, b) => {
            const aHasAssignee = a.currentStage !== 'completed' && a.stages[a.currentStage] && a.stages[a.currentStage].assignedTo;
            const bHasAssignee = b.currentStage !== 'completed' && b.stages[b.currentStage] && b.stages[b.currentStage].assignedTo;
    
            if (aHasAssignee && !bHasAssignee) {
                return -1;
            }
            if (!aHasAssignee && bHasAssignee) {
                return 1;
            }
            return 0;
        });

        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');

            let currentProgress = 0;
            let currentStageName = '';
            let currentPageForDisplay = 0;

            if (task.currentStage && task.currentStage !== 'completed') {
                const stage = task.stages[task.currentStage];
                if (stage && stage.history.length > 0) {
                    currentPageForDisplay = stage.history[stage.history.length - 1].endPage;
                    currentProgress = (currentPageForDisplay / task.totalPages) * 100;
                }
            }
            
            switch(task.currentStage) {
                case 'correction1':
                    currentStageName = '1차 교정';
                    break;
                case 'correction2':
                    currentStageName = '2차 교정';
                    break;
                case 'correction3':
                    currentStageName = '3차 교정';
                    break;
                case 'transcription':
                    currentStageName = '점역';
                    break;
                case 'completed':
                    currentStageName = '모든 작업 완료';
                    currentProgress = 100;
                    currentPageForDisplay = task.totalPages;
                    break;
                default:
                    currentStageName = '알 수 없음';
            }

            const assignedTo = task.currentStage === 'completed' ? '-' : (task.stages[task.currentStage]?.assignedTo || '미정');
            const showAssignButton = task.currentStage !== 'completed' && !task.stages[task.currentStage]?.assignedTo;
            const noteCount = task.notes ? task.notes.length : 0;

            taskItem.innerHTML = `
                <h3 class="task-title" data-id="${task.id}" title="클릭하여 작업 히스토리 보기">${stripHtmlTags(task.book.title)}</h3>
                <p><strong>ISBN:</strong> ${task.book.isbn || '정보 없음'}</p>
                <p><strong>총 페이지:</strong> ${task.totalPages}</p>
                <p><strong>현재 단계:</strong> ${currentStageName}</p>
                <p><strong>진행률:</strong> ${currentProgress.toFixed(1)}% (${currentPageForDisplay}/${task.totalPages} 페이지)</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${Math.min(currentProgress, 100)}%;"></div>
                </div>
                <p><strong>${currentStageName} 담당자:</strong> ${assignedTo}
                    ${showAssignButton ? `<button class="assign-corrector-button" data-id="${task.id}" data-stage="${task.currentStage}">지정</button>` : ''}
                </p>
                ${task.currentStage !== 'completed' ? `<button data-id="${task.id}" class="update-progress-button">진행 상황 업데이트</button>` : ''}
                <button data-id="${task.id}" class="delete-task-button">삭제</button>
                <button data-id="${task.id}" class="notes-button">특이사항 <span class="note-count">${noteCount}</span></button>
            `;
            taskList.appendChild(taskItem);
        });
    }

    // 이벤트 위임을 사용하여 taskList에 대한 클릭 이벤트 처리
    taskList.addEventListener('click', (event) => {
        const target = event.target;
        const taskId = target.dataset.id;
        const task = tasks.find(t => t.id === taskId);

        if (target.classList.contains('update-progress-button')) {
            if (task) {
                openProgressUpdateModal(task);
            }
        } else if (target.classList.contains('delete-task-button')) {
            const password = prompt('작업을 삭제하려면 비밀번호를 입력하세요:');
            if (password === 'maccrey') {
                if (task && confirm(`'${stripHtmlTags(task.book.title)}' 작업을 삭제하시겠습니까?`)) {
                    deleteTask(taskId);
                }
            } else if (password !== null) {
                alert('비밀번호가 올바르지 않습니다.');
            }
        } else if (target.classList.contains('task-title')) {
            if (task) {
                showTaskHistory(task);
            }
        } else if (target.classList.contains('assign-corrector-button')) {
            const stageKey = target.dataset.stage;
            if (task) {
                assignCorrectorFromCard(task, stageKey);
            }
        } else if (target.closest('.notes-button')) {
            if (task) {
                openNotesModal(task);
            }
        }
    });

    // 담당자 지정
    async function assignCorrectorFromCard(task, stageKey) {
        const stageNames = {
            'correction1': '1차 교정',
            'correction2': '2차 교정',
            'correction3': '3차 교정',
            'transcription': '점역'
        };
        
        const stageName = stageNames[stageKey] || stageKey;
        const newAssignedTo = prompt(`${stripHtmlTags(task.book.title)}의 ${stageName} 담당자를 입력해주세요:`);

        if (newAssignedTo && newAssignedTo.trim()) {
            const originalAssignedTo = task.stages[stageKey].assignedTo;
            task.stages[stageKey].assignedTo = newAssignedTo.trim();
            
            try {
                await saveTask(task);
                renderTasks();
                alert('담당자가 지정되었습니다.');
            } catch (error) {
                console.error('Error assigning corrector:', error);
                task.stages[stageKey].assignedTo = originalAssignedTo;
                alert(`담당자 지정에 실패했습니다: ${error.message}`);
            }
        } else if (newAssignedTo === '') {
            alert('담당자 이름을 입력해야 합니다.');
        }
    }

    // 진행 상황 업데이트 모달 열기
    function openProgressUpdateModal(task) {
        currentTaskForUpdate = task;
        const stageKey = task.currentStage;
        
        if (!stageKey || stageKey === 'completed') {
            alert('이미 완료된 작업입니다.');
            return;
        }
        
        const stageNames = {
            'correction1': '1차 교정',
            'correction2': '2차 교정',
            'correction3': '3차 교정',
            'transcription': '점역'
        };
        
        const stageName = stageNames[stageKey] || stageKey;
        const stage = task.stages[stageKey];
        const assignedTo = stage?.assignedTo;

        if (!assignedTo) {
            const newAssignedTo = prompt(`${stageName} 담당자를 먼저 입력해주세요:`);
            if (newAssignedTo && newAssignedTo.trim()) {
                task.stages[stageKey].assignedTo = newAssignedTo.trim();
                saveTask(task).then(() => {
                    renderTasks();
                    openProgressUpdateModal(task);
                }).catch(error => {
                    console.error('Error saving assignee:', error);
                    alert('담당자 저장에 실패했습니다.');
                });
            } else {
                alert('담당자 입력이 취소되었습니다. 진행 상황을 업데이트할 수 없습니다.');
                return;
            }
            return;
        }

        const lastCompletedPage = stage.history.length > 0 ? stage.history[stage.history.length - 1].endPage : 0;

        progressModalTitle.textContent = `${stripHtmlTags(task.book.title)} - 진행 상황 업데이트`;
        progressTaskInfo.innerHTML = `
            <strong>현재 단계:</strong> ${stageName}<br>
            <strong>담당자:</strong> ${assignedTo}<br>
            <strong>총 페이지:</strong> ${task.totalPages}<br>
            <strong>현재 완료 페이지:</strong> ${lastCompletedPage}
        `;

        updatePageInput.value = '';
        updateDatetimeInput.value = '';
        updatePageInput.max = task.totalPages;
        updatePageInput.min = lastCompletedPage + 1;
        
        // 현재 시간을 기본값으로 설정
        const now = new Date();
        const localISOTime = now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
            String(now.getDate()).padStart(2, '0') + 'T' + 
            String(now.getHours()).padStart(2, '0') + ':' + 
            String(now.getMinutes()).padStart(2, '0');
        updateDatetimeInput.value = localISOTime;

        progressUpdateModal.style.display = 'flex';
    }

    // 진행 상황 업데이트 모달 닫기
    function closeProgressUpdateModal() {
        progressUpdateModal.style.display = 'none';
        currentTaskForUpdate = null;
    }

    progressModalCloseButton.addEventListener('click', closeProgressUpdateModal);

    // 진행 상황 업데이트 폼 제출
    progressUpdateForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!currentTaskForUpdate) {
            alert('작업 정보를 찾을 수 없습니다.');
            return;
        }

        const newPage = parseInt(updatePageInput.value);
        let dateTime = updateDatetimeInput.value.trim();
        
        if (!dateTime) {
            dateTime = new Date().toISOString();
        } else {
            dateTime = new Date(dateTime).toISOString();
        }

        const task = currentTaskForUpdate;
        const stageKey = task.currentStage;
        const stage = task.stages[stageKey];
        
        if (!stage) {
            alert('현재 단계 정보를 찾을 수 없습니다.');
            return;
        }

        const lastCompletedPage = stage.history.length > 0 ? stage.history[stage.history.length - 1].endPage : 0;

        // 유효성 검사
        if (isNaN(newPage)) {
            alert('올바른 페이지 번호를 입력해주세요.');
            return;
        }

        if (newPage <= lastCompletedPage) {
            alert(`현재 완료된 페이지(${lastCompletedPage})보다 큰 값을 입력해주세요.`);
            return;
        }

        if (newPage > task.totalPages) {
            alert(`총 페이지(${task.totalPages})를 초과할 수 없습니다.`);
            return;
        }

        // 진행 기록 추가
        const startPage = lastCompletedPage + 1;
        const newHistoryEntry = {
            date: new Date(dateTime).toLocaleString('ko-KR'),
            startPage: startPage,
            endPage: newPage
        };

        // 백업용으로 기존 히스토리 저장
        const originalHistory = [...stage.history];
        const originalStatus = stage.status;

        try {
            stage.history.push(newHistoryEntry);

            // 단계 완료 확인
            if (newPage === task.totalPages) {
                stage.status = 'completed';
            }

            console.log('Updating task progress:', {
                taskId: task.id,
                stage: stageKey,
                newPage: newPage,
                isCompleted: newPage === task.totalPages
            });

            await saveTask(task);

            // 단계 완료 시 다음 단계로 이동
            if (newPage === task.totalPages) {
                const stageNames = {
                    'correction1': '1차 교정',
                    'correction2': '2차 교정',
                    'correction3': '3차 교정',
                    'transcription': '점역'
                };
                
                const stageName = stageNames[stageKey];
                alert(`${stripHtmlTags(task.book.title)}의 ${stageName} 단계가 완료되었습니다!`);
                await moveToNextStage(task);
            } else {
                renderTasks();
            }
            
            closeProgressUpdateModal();
            
        } catch (error) {
            console.error('Error updating progress:', error);
            
            // 실패 시 원래 상태로 복원
            stage.history = originalHistory;
            stage.status = originalStatus;
            
            let errorMessage = '진행 상황 업데이트에 실패했습니다.';
            if (error.message.includes('404')) {
                errorMessage = '해당 작업을 찾을 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.';
                // 데이터 다시 로드
                loadTasks();
            } else if (error.message.includes('500')) {
                errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            } else if (error.message.includes('timeout')) {
                errorMessage = '서버 응답 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.';
            }
            
            alert(errorMessage + ` (${error.message})`);
        }
    });

    // 다음 단계로 이동
    async function moveToNextStage(task) {
        const stagesOrder = ['correction1', 'correction2', 'correction3', 'transcription'];
        const currentIndex = stagesOrder.indexOf(task.currentStage);

        if (currentIndex < stagesOrder.length - 1) {
            let nextStageFound = false;
            
            for (let i = currentIndex + 1; i < stagesOrder.length; i++) {
                const nextStageKey = stagesOrder[i];
                const nextStage = task.stages[nextStageKey];
                
                if (nextStage && nextStage.status !== 'not_applicable') {
                    task.currentStage = nextStageKey;
                    nextStage.status = 'pending';
                    
                    const stageNames = {
                        'correction1': '1차 교정',
                        'correction2': '2차 교정',
                        'correction3': '3차 교정',
                        'transcription': '점역'
                    };
                    
                    alert(`${stripHtmlTags(task.book.title)}의 다음 단계인 ${stageNames[nextStageKey]}가 시작됩니다.`);
                    nextStageFound = true;
                    break;
                }
            }
            
            if (!nextStageFound) {
                task.currentStage = 'completed';
                alert(`${stripHtmlTags(task.book.title)}의 모든 작업이 완료되었습니다!`);
            }
        } else {
            task.currentStage = 'completed';
            alert(`${stripHtmlTags(task.book.title)}의 모든 작업이 완료되었습니다!`);
        }
        
        try {
            await saveTask(task);
            renderTasks();
        } catch (error) {
            console.error('Error moving to next stage:', error);
            alert('다음 단계로 이동하는 데 실패했습니다: ' + error.message);
        }
    }

    // 작업 히스토리 표시
    function showTaskHistory(task) {
        const cleanTitle = stripHtmlTags(task.book.title);

        modalTitle.textContent = `${cleanTitle} - 작업 히스토리`;
        
        const stageNames = {
            'correction1': '1차 교정',
            'correction2': '2차 교정',
            'correction3': '3차 교정',
            'transcription': '점역'
        };

        bookInfoDiv.innerHTML = `
            <h4>도서 정보</h4>
            <p><strong>제목:</strong> ${stripHtmlTags(task.book.title)}</p>
            <p><strong>저자:</strong> ${stripHtmlTags(task.book.author) || '정보 없음'}</p>
            <p><strong>출판사:</strong> ${stripHtmlTags(task.book.publisher) || '정보 없음'}</p>
            <p><strong>ISBN:</strong> ${task.book.isbn || '정보 없음'}</p>
            <p><strong>총 페이지:</strong> ${task.totalPages}</p>
            <hr>
            <h4>진행 단계별 현황</h4>
            ${Object.keys(stageNames).map(stageKey => {
                const stage = task.stages[stageKey];
                if (!stage || stage.status === 'not_applicable') return '';

                const stageName = stageNames[stageKey];
                const currentPages = stage.history.length > 0 ? stage.history[stage.history.length - 1].endPage : 0;
                const progressPercent = ((currentPages / task.totalPages) * 100).toFixed(1);
                
                let statusText = '';
                switch(stage.status) {
                    case 'pending':
                        statusText = task.currentStage === stageKey ? '진행 중' : '대기';
                        break;
                    case 'completed':
                        statusText = '완료';
                        break;
                    default:
                        statusText = stage.status;
                }

                const historyList = stage.history.map(entry => 
                    `<li>${entry.date}: ${entry.startPage}~${entry.endPage} 페이지</li>`
                ).join('');

                return `
                    <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #eee; border-radius: 4px;">
                        <p><strong>${stageName}</strong></p>
                        <p>담당자: ${stage.assignedTo || '미정'}</p>
                        <p>진행률: ${currentPages} / ${task.totalPages} 페이지 (${progressPercent}%)</p>
                        <p>상태: ${statusText}</p>
                        ${historyList ? `<strong>진행 기록:</strong><ul style="margin-top: 5px;">${historyList}</ul>` : '<p style="color: #666;">진행 기록 없음</p>'}
                    </div>
                `;
            }).join('')}
            ${task.currentStage === 'completed' ? '<p style="color: #4CAF50; font-weight: bold; text-align: center;">🎉 모든 작업이 완료되었습니다! 🎉</p>' : ''}
        `;
        
        taskForm.style.display = 'none';
        modal.style.display = 'flex';
    }

    // 서버 연결 상태 주기적 확인 (5분마다)
    setInterval(async () => {
        const isOnline = await checkServerConnection();
        if (isOnline && serverStatus === 'offline') {
            serverStatus = 'online';
            updateStatusDisplay();
            console.log('Server is back online');
            
            // 서버가 다시 온라인이 되면 데이터 다시 로드
            const shouldReload = confirm('서버가 다시 연결되었습니다. 최신 데이터를 불러오시겠습니까?');
            if (shouldReload) {
                await loadTasks();
            }
        }
    }, 300000); // 5분

    // 네트워크 상태 변경 감지
    window.addEventListener('online', async () => {
        console.log('Network back online');
        const isServerOnline = await checkServerConnection();
        if (isServerOnline && serverStatus === 'offline') {
            serverStatus = 'online';
            updateStatusDisplay();
        }
    });

    window.addEventListener('offline', () => {
        console.log('Network went offline');
        if (serverStatus === 'online') {
            serverStatus = 'offline';
            updateStatusDisplay();
        }
    });

    // Notes Modal Functions
    function openNotesModal(task) {
        currentTaskForNotes = task;
        notesModalTitle.textContent = `특이사항 - ${stripHtmlTags(task.book.title)}`;
        noteForm.reset();
        noteIdInput.value = '';
        loadAndRenderNotes(task.id);
        notesModal.style.display = 'flex';
    }

    function closeNotesModal() {
        notesModal.style.display = 'none';
        currentTaskForNotes = null;
    }

    async function loadAndRenderNotes(taskId) {
        try {
            const response = await fetch(`${API_URL}/${taskId}/notes`);
            if (!response.ok) {
                throw new Error('특이사항을 불러오는데 실패했습니다.');
            }
            const notes = await response.json();
            const task = tasks.find(t => t.id === taskId);
            if(task) {
                task.notes = notes;
            }
            renderNotes(notes, taskId);
            renderTasks(); // Update note count on the button
        } catch (error) {
            console.error('Error loading notes:', error);
            notesList.innerHTML = `<p>특이사항을 불러오는데 실패했습니다.</p>`;
        }
    }

    function renderNotes(notes, taskId) {
        notesList.innerHTML = '';
        if (notes.length === 0) {
            notesList.innerHTML = '<p>등록된 특이사항이 없습니다.</p>';
            return;
        }

        notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.classList.add('note-item');
            noteItem.dataset.noteId = note.noteId;

            noteItem.innerHTML = `
                <p class="note-meta"><strong>작성자:</strong> ${note.author} | <strong>작성일:</strong> ${new Date(note.createdAt).toLocaleString('ko-KR')}</p>
                <p>${note.content}</p>
                <div class="note-actions">
                    <button class="edit-note-button">수정</button>
                    <button class="delete-note-button">삭제</button>
                </div>
            `;

            noteItem.querySelector('.edit-note-button').addEventListener('click', () => {
                noteIdInput.value = note.noteId;
                noteAuthorInput.value = note.author;
                noteContentInput.value = note.content;
            });

            noteItem.querySelector('.delete-note-button').addEventListener('click', () => {
                if (confirm('정말로 이 특이사항을 삭제하시겠습니까?')) {
                    deleteNote(taskId, note.noteId);
                }
            });

            notesList.appendChild(noteItem);
        });
    }

    noteForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const taskId = currentTaskForNotes.id;
        const noteId = noteIdInput.value;
        const author = noteAuthorInput.value.trim();
        const content = noteContentInput.value.trim();

        if (!author || !content) {
            alert('작성자와 내용을 모두 입력해주세요.');
            return;
        }

        const url = noteId ? `${API_URL}/${taskId}/notes/${noteId}` : `${API_URL}/${taskId}/notes`;
        const method = noteId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ author, content })
            });

            if (!response.ok) {
                throw new Error('특이사항 저장에 실패했습니다.');
            }

            noteForm.reset();
            noteIdInput.value = '';
            loadAndRenderNotes(taskId);

        } catch (error) {
            console.error('Error saving note:', error);
            alert(error.message);
        }
    });

    async function deleteNote(taskId, noteId) {
        try {
            const response = await fetch(`${API_URL}/${taskId}/notes/${noteId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('특이사항 삭제에 실패했습니다.');
            }

            loadAndRenderNotes(taskId);

        } catch (error) {
            console.error('Error deleting note:', error);
            alert(error.message);
        }
    }

    notesModalCloseButton.addEventListener('click', closeNotesModal);
});