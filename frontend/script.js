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

    // TODO: 국립중앙도서관 API 키를 여기에 입력하세요.
    const apiKey = 'e080d32c1a94808682a5c4fe268ba6f9e5aedf09c936f44ecb51272e59287233';

    let currentBook = null; // 현재 모달에 표시될 책 정보
    let tasks = []; // 작업 목록을 저장할 배열

    // --- Local Storage Functions ---
    function saveTasks() {
        localStorage.setItem('brailleTasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const savedTasks = localStorage.getItem('brailleTasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
        renderTasks(); // Add this line to render tasks after loading
    }

    // HTML 태그를 제거하는 헬퍼 함수
    function stripHtmlTags(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    // --- End Local Storage Functions ---

    loadTasks(); // 페이지 로드 시 저장된 작업 불러오기 및 렌더링

    // 점역자 체크박스 변경 이벤트
    enableTranscriberCheckbox.addEventListener('change', () => {
        transcriberInput.disabled = !enableTranscriberCheckbox.checked;
        if (transcriberInput.disabled) {
            transcriberInput.value = ''; // 비활성화 시 값 초기화
        }
    });

    // 모달 열기 함수
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

        // 폼 초기화 및 보이기
        taskForm.reset();
        // 점역자 체크박스 및 입력 필드 초기화
        enableTranscriberCheckbox.checked = true; // 기본적으로 체크
        transcriberInput.disabled = false; // 기본적으로 활성화
        taskForm.style.display = 'block'; // 폼 다시 보이게 설정
        modal.style.display = 'flex';
    }

    // 모달 닫기 함수
    function closeModal() {
        modal.style.display = 'none';
        taskForm.style.display = 'block'; // 모달 닫을 때 폼 다시 보이게 설정
    }

    // 국립중앙도서관 API를 이용한 도서 검색 함수
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
                    totalPages: null // API가 페이지 정보를 제공하지 않음
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

    // 검색 버튼 클릭 이벤트
    searchButton.addEventListener('click', () => {
        const query = isbnTitleInput.value.trim();
        if (query) {
            searchBooks(query);
        } else {
            alert('ISBN 또는 책 제목을 입력해주세요.');
        }
    });

    // 신규 등록 버튼 클릭 이벤트
    addNewButton.addEventListener('click', () => {
        openModal(); // 책 정보 없이 모달 열기
    });

    // 로컬 데이터 리셋 버튼 클릭 이벤트
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

    // 모달 닫기 버튼 클릭 이벤트
    closeButton.addEventListener('click', closeModal);

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // 작업 폼 제출 이벤트
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
            id: Date.now(), // 고유 ID
            book: newBook,
            totalPages: totalPages,
            stages: {
                correction1: { assignedTo: corrector1, history: [], status: 'pending' },
                correction2: { assignedTo: corrector2, history: [], status: 'pending' }, // 항상 pending으로 시작
                correction3: { assignedTo: corrector3, history: [], status: 'pending' }, // 항상 pending으로 시작
                transcription: { assignedTo: transcriber, history: [], status: isTranscriberEnabled && transcriber ? 'pending' : 'not_applicable' }
            },
            currentStage: 'correction1' // 초기 단계
        };

        tasks.push(newTask);
        saveTasks(); // Save tasks after adding a new one
        renderTasks();
        closeModal();
    });

    // 작업 목록 렌더링 함수
    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');

            let currentProgress = 0;
            let currentStageName = '';
            let currentPageForDisplay = 0;

            // 현재 진행 단계 및 진행률 계산
            if (task.currentStage === 'correction1') {
                currentStageName = '1차 교정';
                currentPageForDisplay = task.stages.correction1.history.length > 0 ? task.stages.correction1.history[task.stages.correction1.history.length - 1].endPage : 0;
                currentProgress = (currentPageForDisplay / task.totalPages) * 100;
            } else if (task.currentStage === 'correction2') {
                currentStageName = '2차 교정';
                currentPageForDisplay = task.stages.correction2.history.length > 0 ? task.stages.correction2.history[task.stages.correction2.history.length - 1].endPage : 0;
                currentProgress = (currentPageForDisplay / task.totalPages) * 100;
            } else if (task.currentStage === 'correction3') {
                currentStageName = '3차 교정';
                currentPageForDisplay = task.stages.correction3.history.length > 0 ? task.stages.correction3.history[task.stages.correction3.history.length - 1].endPage : 0;
                currentProgress = (currentPageForDisplay / task.totalPages) * 100;
            } else if (task.currentStage === 'transcription') {
                currentStageName = '점역';
                currentPageForDisplay = task.stages.transcription.history.length > 0 ? task.stages.transcription.history[task.stages.transcription.history.length - 1].endPage : 0;
                currentProgress = (currentPageForDisplay / task.totalPages) * 100;
            } else if (task.currentStage === 'completed') { // Add this block
                currentStageName = '모든 작업 완료';
                currentProgress = 100; // All stages completed, so 100% progress
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

        // 진행 상황 업데이트 버튼 이벤트 리스너 추가
        document.querySelectorAll('.update-progress-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const taskId = parseInt(event.target.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    updateTaskProgress(task);
                }
            });
        });

        // 삭제 버튼 이벤트 리스너 추가
        document.querySelectorAll('.delete-task-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const taskId = parseInt(event.target.dataset.id);
                deleteTask(taskId);
            });
        });

        // 작업 제목 클릭 이벤트 리스너 추가
        document.querySelectorAll('.task-title').forEach(titleElement => {
            titleElement.addEventListener('click', (event) => {
                const taskId = parseInt(event.target.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    showTaskHistory(task);
                }
            });
        });

        // 카드에서 교정자 지정 버튼 이벤트 리스너 추가
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

    // 카드에서 교정자 지정 함수
    function assignCorrectorFromCard(task, stageKey) {
        const stageName = stageKey === 'correction1' ? '1차 교정' :
                         stageKey === 'correction2' ? '2차 교정' :
                         stageKey === 'correction3' ? '3차 교정' :
                         '점역';
        const newAssignedTo = prompt(`${stripHtmlTags(task.book.title)}의 ${stageName} 담당자를 입력해주세요:`);

        if (newAssignedTo) {
            task.stages[stageKey].assignedTo = newAssignedTo;
            saveTasks();
            renderTasks(); // 변경 사항 반영을 위해 다시 렌더링
        } else if (newAssignedTo === '') {
            alert('담당자 이름을 입력해야 합니다.');
        }
    }

    // 작업 삭제 함수
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

    // 작업 진행 상황 업데이트 함수
    function updateTaskProgress(task) {
        let stageKey = task.currentStage;
        let lastCompletedPage = task.stages[stageKey].history.length > 0 ? task.stages[stageKey].history[task.stages[stageKey].history.length - 1].endPage : 0;
        let assignedTo = task.stages[stageKey].assignedTo;

        const stageName = stageKey === 'correction1' ? '1차 교정' :
                         stageKey === 'correction2' ? '2차 교정' :
                         stageKey === 'correction3' ? '3차 교정' :
                         '점역';

        // 현재 단계의 담당자가 비어있으면 입력받기
        if (!assignedTo) {
            const newAssignedTo = prompt(`${stageName} 담당자를 입력해주세요:`);
            if (newAssignedTo) {
                task.stages[stageKey].assignedTo = newAssignedTo;
                assignedTo = newAssignedTo;
                saveTasks(); // 담당자 변경 저장
            } else {
                alert('담당자 입력이 취소되었습니다. 진행 상황을 업데이트할 수 없습니다.');
                return; // 담당자 입력 취소 시 함수 종료
            }
        }

        const newPage = parseInt(prompt(`현재 ${assignedTo}님(${stageName})의 진행 페이지를 입력하세요 (총 ${task.totalPages} 페이지, 현재 ${lastCompletedPage} 페이지):`));

        if (!isNaN(newPage) && newPage >= lastCompletedPage && newPage <= task.totalPages) {
            const dateTime = new Date().toLocaleString(); // 날짜와 시간 모두 포함
            const startPage = lastCompletedPage + 1;
            task.stages[stageKey].history.push({ date: dateTime, startPage: startPage, endPage: newPage });
            saveTasks(); // Save tasks after updating progress
            if (newPage === task.totalPages) {
                task.stages[stageKey].status = 'completed';
                alert(`${stripHtmlTags(task.book.title)}의 ${stageName} 단계가 완료되었습니다!`);
                // 다음 단계로 전환
                moveToNextStage(task);
                // renderTasks() is called by moveToNextStage, so no need to call it here
            } else {
                renderTasks(); // Only render if stage is not completed (moveToNextStage will render)
            }
        } else if (!isNaN(newPage)) {
            alert('유효한 페이지를 입력하거나, 현재 페이지보다 큰 값을 입력해주세요.');
        }
    }

    // 다음 단계로 전환 함수
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
        saveTasks(); // Save tasks after stage transition
        renderTasks(); // Ensure renderTasks is called here
    }

    // 작업 히스토리 표시 함수
    function showTaskHistory(task) {
        // HTML 태그를 제거하여 순수한 텍스트만 추출
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = task.book.title;
        const cleanTitle = tempDiv.textContent || tempDiv.innerText || '';

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
                if (!stage) return ''; // Should not happen if stages are well-defined

                const stageName = stageKey === 'correction1' ? '1차 교정' :
                                 stageKey === 'correction2' ? '2차 교정' :
                                 stageKey === 'correction3' ? '3차 교정' :
                                 '점역';

                // Logic to determine if the stage should be displayed
                let shouldDisplay = false;
                if (stage.status === 'not_applicable') {
                    shouldDisplay = false;
                } else if (stage.status === 'completed') {
                    shouldDisplay = true;
                } else if (stageKey === task.currentStage) {
                    shouldDisplay = true;
                } else {
                    // Check if the previous stage is completed to show the next pending stage
                    const stagesOrder = ['correction1', 'correction2', 'correction3', 'transcription'];
                    const thisStageIndex = stagesOrder.indexOf(stageKey);
                    if (thisStageIndex > 0) {
                        const prevStageKey = stagesOrder[thisStageIndex - 1];
                        const prevStage = task.stages[prevStageKey];
                        if (prevStage && prevStage.status === 'completed') {
                            shouldDisplay = true;
                        }
                    }
                }

                if (!shouldDisplay) {
                    return '';
                }

                const historyList = stage.history.map(entry => `<li>${entry.date}: ${entry.startPage}~${entry.endPage} 페이지</li>`).join('');
                const currentPages = stage.history.length > 0 ? stage.history[stage.history.length - 1].endPage : 0;
                return `
                    <p><strong>${stageName} (${stage.assignedTo || '미정'})</strong>: ${currentPages} / ${task.totalPages} 페이지 (${(currentPages / task.totalPages * 100).toFixed(2)}%) - ${stage.status === 'pending' ? '진행 중' : stage.status === 'completed' ? '완료' : '대기'}</p>
                    ${historyList ? `<ul>${historyList}</ul>` : '<p>진행 기록 없음</p>'}
                `;
            }).join('')}
        `;
        taskForm.style.display = 'none'; // 폼 숨기기
        modal.style.display = 'flex';
    }
});