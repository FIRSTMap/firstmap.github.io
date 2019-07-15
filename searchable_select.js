'use strict';

class SearchableSelect {
    constructor(elem, onSelect) {
        for (let child of elem.children) {
            let type = child.nodeName.toLowerCase();

            if (type == 'input') {
                this.input = child;
            } else if (type == 'ul') {
                this.list = child;
            }
        }

        if (!this.input || !this.list) {
            throw new Error('Unable to find input/list in SearchableSelect element!');
        }

        this.onSelect = onSelect;
        let obj = this;

        elem.classList.add('searchable-select');
        this.list.classList.add('hidden');

        this.list.addEventListener('click', function(e) {
            if (e.target && e.target.nodeName.toLowerCase() === 'li') {
                let selected = obj.getSelectedObj();

                if (selected) {
                    selected.classList.remove('selected');
                }

                e.target.classList.add('selected');
                
                if (obj.selectTimeout) {
                    clearTimeout(obj.selectTimeout);
                    obj.selectTimeout = null;
                }
                
                obj.applySelection();
            }
        });
        
        this.input.addEventListener('blur', function() {
            // If the user clicks something in the list, it will trigger this
            // blur event, but the click event on the list will not trigger if
            // the list is hidden immediately, so a setTimeout is required to
            // make sure a click on the list goes through.
            if (obj.selectTimeout) {
                clearTimeout(obj.selectTimeout);
                obj.selectTimeout = null;
            }
            
            obj.selectTimeout = setTimeout(function() {
                obj.applySelection(obj);
            }, 300);
        });

        this.input.addEventListener('focus', function() {
            obj.list.classList.remove('hidden');
            obj.input.select();
            
            obj.search();
        });

        // Use a function to make sure the event doesn't pass any
        // parameters to search 
        this.input.addEventListener('input', function() { obj.search() });

        this.input.addEventListener('keydown', function() {
            let selected = obj.getSelectedObj();

            if (event.key === 'Enter') {
                // Unfocus the textbox on enter key. The blur
                // event handler will take care of the rest.
                obj.input.blur();

                // Select can happen instantly when pressing enter.
                if (obj.selectTimeout) {
                    clearTimeout(obj.selectTimeout);
                    obj.selectTimeout = null;
                    obj.applySelection();
                }

            } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                // Don't let the cursor be moved by the key press
                event.preventDefault();

                if (selected) {
                    let newSelect = selected;
        
                    if (event.key === 'ArrowUp') {
                        // Get the next list item up that isn't hidden (if there is one)
                        do {
                            newSelect = newSelect.previousSibling;
                        } while (newSelect && newSelect.classList.contains('hidden'));
                    } else {
                        // Get the next list item down that isn't hidden (if there is one)
                        do {
                            newSelect = newSelect.nextSibling;
                        } while (newSelect && newSelect.classList.contains('hidden'));
                    }
        
                    // If there is a next list item up/down, make it the new selected item
                    if (newSelect) {
                        selected.classList.remove('selected');
                        newSelect.classList.add('selected');
                        newSelect.scrollIntoView({block: 'nearest'});
                    }
                }
            }
        });
    }

    search(query) {
        let search;

        if (typeof(query) === 'string') {
            this.input.value = query;
            search = query.toLowerCase();
        } else {
            search = this.input.value.toLowerCase();
        }

        // Hide the list items that do not have the search query
        for (let child of this.list.children) {
            if (child.innerText.toLowerCase().includes(search)) {
                child.classList.remove('hidden');
            } else {
                child.classList.add('hidden');
            }
        }

        // Un-select the currently selected list item
        for (let option of this.list.children) {
            if (option.classList.contains('selected')) {
                option.classList.remove('selected');
                break;
            }
        }

        // Select the first list item that is not hidden (or none if there are none)
        for (let option of this.list.children) {
            if (!option.classList.contains('hidden')) {
                option.classList.add('selected');
                option.scrollIntoView({ block: 'nearest' });
                break;
            }
        }
    }

    getSelectedObj() {
        let selected = null;

        for (let option of this.list.children) {
            if (option.classList.contains('selected')) {
                selected = option;
                break;
            }
        }

        return selected;
    }

    setSelection(value) {
        let selected = this.getSelectedObj();

        if (selected) {
            selected.classList.remove('selected');
        }

        let obj = null;

        for (let option of this.list.children) {
            if (option.dataset.value == value) {
                obj = option;
                break;
            }
        }

        obj.classList.add('selected');

        this.applySelection();
    }

    applySelection() {
        let selected = this.getSelectedObj();

        this.list.classList.add('hidden');

        if (selected) {
            this.input.value = selected.innerText;

            if (this.onSelect) {
                this.onSelect(selected.dataset.value);
            }
        } else {
            this.input.value = '';

            if (this.onSelect) {
                this.onSelect('');
            }
        }
    }
}
