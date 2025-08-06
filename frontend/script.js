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

    const apiKey = 'e080d32c1a94808682a5c4fe268ba6f9e5aedf09c936f44ecb51272e59287233';

    let currentBook = null;
    let tasks = [];
    let currentTaskForUpdate = null;

    function saveTasks() {
        localStorage.setItem('brailleTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const savedTasks = localStorage.getItem('brailleTasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
        renderTasks();
    }

    function stripHtmlTags(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    loadTasks();

    enableTranscriberCheckbox.addEventListener('change', () => {
        transcriberInput.disabled = !enableTranscriberCheckbox.checked;
        if (transcriberInput.disabled) {
            transcriberInput.value = '';
        }
    });

    function openModal(title = '신규 도서 등록', book = null) {
        modalTitle.textContent = title;
        bookInfoDiv.innerHTML = '';
        currentBook = book;

        if (book) {
            bookInfoDiv.innerHTML = `
                <p><strong>제목:</strong> ${book.title}</p>
                <p><strong>저자:</strong> ${book.author || '정보 없음'}</p>
                <p><strong>출판사:</strong> ${book.publisher || '정보 없음'}</p>
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
        enableTranscriberCheckbox.checked = true;
        transcriberInput.disabled = false;
        taskForm.style.display = 'block';
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        taskForm.style.display = 'block';
    }

    async function searchBooks(query) {
        if (apiKey === 'YOUR_API_KEY') {
            alert('국립중앙도서관 API 키를 script.js 파일에 입력해주세요.');
            return;
        }

        const url = `https://www.nl.go.kr/NL/search/openApi/search.do?key=${apiKey}&apiType=json&srchTarget=total&kwd=${query}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.result && data.result.length > 0) {
                const book = data.result[0];
                const bookInfo = {
                    title: book.titleInfo,
                    author: book.authorInfo,
                    publisher: book.pubInfo,
                    isbn: book.isbn,
                    totalPages: null
                };
                openModal('도서 정보 확인 및 등록', bookInfo);
            } else {
                alert('검색 결과가 없습니다.');
            }
        } catch (error) {
            console.error('Error fetching book data:', error);
            alert(`책 정보를 가져오는 데 실패했습니다: ${error.message}`);
        }
    }

    searchButton.addEventListener('click', () => {
        const query = isbnTitleInput.value.trim();
        if (query) {
            searchBooks(query);
        } else {
            alert('ISBN 또는 책 제목을 입력해주세요.');
        }
    });

    addNewButton.addEventListener('click', () => {
        openModal();
    });

    resetButton.addEventListener('click', () => {
        const password = prompt('로컬 데이터를 리셋하려면 비밀번호를 입력하세요:');
        if (password === 'maccrey') {
            if (confirm('정말로 모든 작업 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                localStorage.removeItem('brailleTasks');
                tasks = [];
                renderTasks();
                alert('모든 데이터가 삭제되었습니다.');
            }
        } else if (password !== null) {
            alert('비밀번호가 올바르지 않습니다.');
        }
    });

    closeButton.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
        if (event.target == progressUpdateModal) {
            closeProgressUpdateModal();
        }
    });

    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const newBook = currentBook || {
            title: document.getElementById('manual-title').value.trim(),
            author: document.getElementById('manual-author').value.trim(),
            publisher: document.getElementById('manual-publisher').value.trim(),
            isbn: document.getElementById('manual-isbn').value.trim()
        };

        if (!newBook.title) {
            alert('책 제목은 필수입니다.');
            return;
        }

        const totalPages = parseInt(totalPagesInput.value);
        const corrector1 = corrector1Input.value.trim();
        const corrector2 = corrector2Input.value.trim();
        const corrector3 = corrector3Input.value.trim();
        const transcriber = transcriberInput.value.trim();
        const isTranscriberEnabled = enableTranscriberCheckbox.checked;

        const newTask = {
            id: Date.now(),
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

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        closeModal();
    });

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');

            let currentProgress = 0;
            let currentStageName = '';
            let currentPageForDisplay = 0;

            if (task.currentStage) {
                const stage = task.stages[task.currentStage];
                if (stage) {
                    currentPageForDisplay = stage.history.length > 0 ? stage.history[stage.history.length - 1].endPage : 0;
                    currentProgress = (currentPageForDisplay / task.totalPages) * 100;
                }
            }
            
            if (task.currentStage === 'correction1') currentStageName = '1차 교정';
            else if (task.currentStage === 'correction2') currentStageName = '2차 교정';
            else if (task.currentStage === 'correction3') currentStageName = '3차 교정';
            else if (task.currentStage === 'transcription') currentStageName = '점역';
            else if (task.currentStage === 'completed') {
                currentStageName = '모든 작업 완료';
                currentProgress = 100;
                currentPageForDisplay = task.totalPages;
            }

            taskItem.innerHTML = `
                <h3 class="task-title" data-id="${task.id}" title="클릭하여 작업 히스토리 보기">${stripHtmlTags(task.book.title)}</h3>
                <p><strong>ISBN:</strong> ${task.book.isbn}</p>
                <p><strong>총 페이지:</strong> ${task.totalPages}</p>
                <p><strong>현재 단계:</strong> ${currentStageName}</p>
                <p><strong>진행률:</strong> ${currentProgress.toFixed(2)}%</p>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${currentProgress}%;"></div>
                </div>
                <p><strong>${currentStageName} 담당자:</strong> ${task.currentStage === 'completed' ? '-' : task.stages[task.currentStage].assignedTo || '미정'}
                    ${task.currentStage === 'completed' || !task.stages[task.currentStage].assignedTo ? `<button class="assign-corrector-button" data-id="${task.id}" data-stage="${task.currentStage}">지정</button>` : ''}
                </p>
                <button data-id="${task.id}" class="update-progress-button">진행 상황 업데이트</button>
                <button data-id="${task.id}" class="delete-task-button">삭제</button>
            `;
            taskList.appendChild(taskItem);
        });

        document.querySelectorAll('.update-progress-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const taskId = parseInt(event.target.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    openProgressUpdateModal(task);
                }
            });
        });

        document.querySelectorAll('.delete-task-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const taskId = parseInt(event.target.dataset.id);
                deleteTask(taskId);
            });
        });

        document.querySelectorAll('.task-title').forEach(titleElement => {
            titleElement.addEventListener('click', (event) => {
                const taskId = parseInt(event.target.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    showTaskHistory(task);
                }
            });
        });

        document.querySelectorAll('.assign-corrector-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const taskId = parseInt(event.target.dataset.id);
                const stageKey = event.target.dataset.stage;
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    assignCorrectorFromCard(task, stageKey);
                }
            });
        });
    }

    function assignCorrectorFromCard(task, stageKey) {
        const stageName = stageKey === 'correction1' ? '1차 교정' :
                         stageKey === 'correction2' ? '2차 교정' :
                         stageKey === 'correction3' ? '3차 교정' :
                         '점역';
        const newAssignedTo = prompt(`${stripHtmlTags(task.book.title)}의 ${stageName} 담당자를 입력해주세요:`);

        if (newAssignedTo) {
            task.stages[stageKey].assignedTo = newAssignedTo;
            saveTasks();
            renderTasks();
        } else if (newAssignedTo === '') {
            alert('담당자 이름을 입력해야 합니다.');
        }
    }

    function deleteTask(taskId) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            if (confirm(`'${stripHtmlTags(tasks[taskIndex].book.title)}' 작업을 삭제하시겠습니까?`)) {
                tasks.splice(taskIndex, 1);
                saveTasks();
                renderTasks();
            }
        }
    }

    function openProgressUpdateModal(task) {
        currentTaskForUpdate = task;
        const stageKey = task.currentStage;
        const stageName = stageKey === 'correction1' ? '1차 교정' :
                         stageKey === 'correction2' ? '2차 교정' :
                         stageKey === 'correction3' ? '3차 교정' :
                         '점역';
        const assignedTo = task.stages[stageKey].assignedTo;
        const lastCompletedPage = task.stages[stageKey].history.length > 0 ? task.stages[stageKey].history[task.stages[stageKey].history.length - 1].endPage : 0;

        if (!assignedTo) {
            const newAssignedTo = prompt(`${stageName} 담당자를 입력해주세요:`);
            if (newAssignedTo) {
                task.stages[stageKey].assignedTo = newAssignedTo;
                saveTasks();
                renderTasks();
            } else {
                alert('담당자 입력이 취소되었습니다. 진행 상황을 업데이트할 수 없습니다.');
                return;
            }
        }

        progressModalTitle.textContent = `${stripHtmlTags(task.book.title)} - 진행 상황 업데이트`;
        progressTaskInfo.innerHTML = `<strong>현재 단계:</strong> ${stageName}<br><strong>담당자:</strong> ${task.stages[stageKey].assignedTo}<br><strong>총 페이지:</strong> ${task.totalPages}<br><strong>현재 완료 페이지:</strong> ${lastCompletedPage}`;

        updatePageInput.value = '';
        updateDatetimeInput.value = new Date().toLocaleString('sv-SE').replace(' ', 'T');
        updatePageInput.max = task.totalPages;
        updatePageInput.min = lastCompletedPage + 1;

        progressUpdateModal.style.display = 'flex';
    }

    function closeProgressUpdateModal() {
        progressUpdateModal.style.display = 'none';
    }

    progressModalCloseButton.addEventListener('click', closeProgressUpdateModal);

    progressUpdateForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const newPage = parseInt(updatePageInput.value);
        const dateTime = updateDatetimeInput.value.trim();
        const task = currentTaskForUpdate;
        const stageKey = task.currentStage;
        const lastCompletedPage = task.stages[stageKey].history.length > 0 ? task.stages[stageKey].history[task.stages[stageKey].history.length - 1].endPage : 0;

        if (!dateTime) {
            alert('날짜와 시간을 입력해주세요.');
            return;
        }

        if (!isNaN(newPage) && newPage > lastCompletedPage && newPage <= task.totalPages) {
            const startPage = lastCompletedPage + 1;
            task.stages[stageKey].history.push({ date: new Date(dateTime).toLocaleString(), startPage: startPage, endPage: newPage });
            saveTasks();

            if (newPage === task.totalPages) {
                const stageName = stageKey === 'correction1' ? '1차 교정' :
                                 stageKey === 'correction2' ? '2차 교정' :
                                 stageKey === 'correction3' ? '3차 교정' :
                                 '점역';
                task.stages[stageKey].status = 'completed';
                alert(`${stripHtmlTags(task.book.title)}의 ${stageName} 단계가 완료되었습니다!`);
                moveToNextStage(task);
            } else {
                renderTasks();
            }
            closeProgressUpdateModal();
        } else {
            alert('유효한 페이지를 입력하거나, 현재 페이지보다 큰 값을 입력해주세요.');
        }
    });

    function moveToNextStage(task) {
        const stagesOrder = ['correction1', 'correction2', 'correction3', 'transcription'];
        const currentIndex = stagesOrder.indexOf(task.currentStage);

        if (currentIndex < stagesOrder.length - 1) {
            let nextStageFound = false;
            for (let i = currentIndex + 1; i < stagesOrder.length; i++) {
                const nextStageKey = stagesOrder[i];
                if (task.stages[nextStageKey].status !== 'not_applicable') {
                    task.currentStage = nextStageKey;
                    task.stages[nextStageKey].status = 'pending';
                    alert(`${stripHtmlTags(task.book.title)}의 다음 단계인 ${nextStageKey}가 시작됩니다.`);
                    nextStageFound = true;
                    break;
                }
            }
            if (!nextStageFound) {
                alert(`${stripHtmlTags(task.book.title)}의 모든 작업이 완료되었습니다!`);
                task.currentStage = 'completed';
            }
        } else {
            alert(`${stripHtmlTags(task.book.title)}의 모든 작업이 완료되었습니다!`);
            task.currentStage = 'completed';
        }
        saveTasks();
        renderTasks();
    }

    function showTaskHistory(task) {
        const cleanTitle = stripHtmlTags(task.book.title);

        modalTitle.textContent = `${cleanTitle} - 작업 히스토리`;
        bookInfoDiv.innerHTML = `
            <h4>도서 정보</h4>
            <p><strong>제목:</strong> ${task.book.title}</p>
            <p><strong>저자:</strong> ${task.book.author || '정보 없음'}</p>
            <p><strong>출판사:</strong> ${task.book.publisher || '정보 없음'}</p>
            <p><strong>ISBN:</strong> ${task.book.isbn || '정보 없음'}</p>
            <p><strong>총 페이지:</strong> ${task.totalPages}</p>
            <hr>
            <h4>진행 단계별 현황</h4>
            ${['correction1', 'correction2', 'correction3', 'transcription'].map(stageKey => {
                const stage = task.stages[stageKey];
                if (!stage || stage.status === 'not_applicable') return '';

                const stageName = stageKey === 'correction1' ? '1차 교정' :
                                 stageKey === 'correction2' ? '2차 교정' :
                                 stageKey === 'correction3' ? '3차 교정' :
                                 '점역';

                const historyList = stage.history.map(entry => `<li>${entry.date}: ${entry.startPage}~${entry.endPage} 페이지</li>`).join('');
                const currentPages = stage.history.length > 0 ? stage.history[stage.history.length - 1].endPage : 0;
                return `
                    <p><strong>${stageName} (${stage.assignedTo || '미정'})</strong>: ${currentPages} / ${task.totalPages} 페이지 (${(currentPages / task.totalPages * 100).toFixed(2)}%) - ${stage.status === 'pending' ? '진행 중' : stage.status === 'completed' ? '완료' : '대기'}</p>
                    ${historyList ? `<ul>${historyList}</ul>` : '<p>진행 기록 없음</p>'}
                `;
            }).join('')}
        `;
        taskForm.style.display = 'none';
        modal.style.display = 'flex';
    }
});
