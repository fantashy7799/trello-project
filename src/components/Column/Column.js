import React, { useEffect, useRef, useState } from 'react'
import Card from 'components/Card/Card'
import { mapOrder } from 'utilities/sorts'
import { Container, Draggable } from 'react-smooth-dnd'
import { Dropdown, Form, Button } from 'react-bootstrap'
import ConfirmModal from 'components/Common/ConfirmModal'
import { MODAL_ACTION_CONFIRM } from 'utilities/constants'
import { saveContentAfterPressEnter, selectAllInlineText } from 'utilities/contentEditable'
import { cloneDeep } from 'lodash'
import { createNewCard, updateColumn } from 'actions/ApiCall'

import './Column.scss'

function Column(props) {
  const { column, onCardDrop, onUpdateColumnState } = props
  const cards = mapOrder(column.cards, column.cardOrder, '_id')

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const toggleShowConfirmModal = () => setShowConfirmModal(!showConfirmModal)

  const [columnTitle, setColumnTitle] = useState('')
  const handleColumnTitleChange = (e) => setColumnTitle(e.target.value)

  const [openNewCardForm, setOpenNewCardForm] = useState(false)
  const toggleOpenNewCardForm = () => { setOpenNewCardForm(!openNewCardForm) }

  const newCardTexareaRef = useRef(null)

  const [newCardTitle, setNewCardTitle] = useState('')
  const onNewCardTitleChange = (e) => setNewCardTitle(e.target.value)

  useEffect(() => {
    setColumnTitle(column.title)
  }, [column.title])

  useEffect(() => {
    if (newCardTexareaRef && newCardTexareaRef.current) {
      newCardTexareaRef.current.focus()
      newCardTexareaRef.current.select()
    }
  }, [openNewCardForm])

  const onConfirmModalAction = (type) => {

    if (type === MODAL_ACTION_CONFIRM) {
      const newColumn = {
        ...column,
        _destroy: true
      }
      //Call Api update column
      updateColumn(newColumn._id, newColumn).then(updatedColumn => {
        onUpdateColumnState(updatedColumn)
      })
    }
    toggleShowConfirmModal()
  }

  //Update columns tittle
  const handleColumnTitleBlur = () => {
    if (columnTitle !== column.title) {
      const newColumn = {
        ...column,
        title: columnTitle
      }

      //Call Api update column
      updateColumn(newColumn._id, newColumn).then(updatedColumn => {
        updatedColumn.cards = newColumn.cards
        onUpdateColumnState(updatedColumn)
      })
    }
  }

  const addNewCard = () => {
    if (!newCardTitle) {
      newCardTexareaRef.current.focus()
      return
    }

    const newCardToAdd = {
      boardId: column.boardId,
      columnId: column._id,
      title: newCardTitle.trim()
    }

    //call Api
    createNewCard(newCardToAdd).then(card => {
      let newColumn = cloneDeep(column)
      newColumn.cards.push(card)
      newColumn.cardOrder.push(card._id)

      onUpdateColumnState(newColumn)
      setNewCardTitle('')
      toggleOpenNewCardForm()
    })
  }


  return (
    <div className='column'>
      <header className='column-drag-handle'>
        <div className='column-title'>
          <Form.Control
            size="sm"
            type="text"
            className='trello-content-editable'
            value={columnTitle}
            onChange={handleColumnTitleChange}
            onBlur = {handleColumnTitleBlur}
            onKeyDown = {saveContentAfterPressEnter}
            onMouseDown = {e => e.preventDefault()}
            onClick={selectAllInlineText}
            spellCheck='false'
          />
        </div>
        <div className='column-dropdown-actions'>
          <Dropdown>
            <Dropdown.Toggle id="dropdown-basic" size='sm' className='dropdown-btn'/>

            <Dropdown.Menu>
              <Dropdown.Item onClick={toggleOpenNewCardForm}>Add card...</Dropdown.Item>
              <Dropdown.Item onClick={toggleShowConfirmModal}>Remove column...</Dropdown.Item>
              <Dropdown.Item >Move all cards in this column...</Dropdown.Item>
              <Dropdown.Item >Archive all cards in this column...</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </header>
      <div className="card-list">
        <Container
          orientation='vertical'
          groupName="uydinh-columns"
          onDrop={dropResult => onCardDrop(column._id, dropResult)}
          getChildPayload={index => cards[index]}
          dragClass="card-ghost"
          dropClass="card-ghost-drop"
          dropPlaceholder={{
            animationDuration: 150,
            showOnTop: true,
            className: 'card-drop-preview'
          }}
          dropPlaceholderAnimationDuration={200}
        >

          {cards.map((card, index) => (
            <Draggable key={index}>
              <Card card={card}/>
            </Draggable>
          ))}
        </Container>
        {openNewCardForm &&
          <div className='add-new-card-area'>
            <Form.Control
              size="sm"
              type="textarea"
              rows='3'
              placeholder="Enter a title for this card..."
              className='textarea-enter-new-card'
              ref={newCardTexareaRef}
              value={newCardTitle}
              onChange={onNewCardTitleChange}
              onKeyDown={event => (event.key === 'Enter') && addNewCard()}
            />
          </div>
        }

      </div>
      <footer>
        {openNewCardForm &&
          <div className='add-new-card-area'>
            <Button variant="success" size='sm' onClick={addNewCard}>
               Add card
            </Button>{' '}

            <span className='cancel-icon' onClick={toggleOpenNewCardForm}>
              <i className='fa fa-trash icon'></i>
            </span>
          </div>
        }

        {!openNewCardForm &&
          <div className='footer-action' onClick={toggleOpenNewCardForm}>
            <i className='fa fa-plus icons'>  </i> Add another card
          </div>
        }

      </footer>

      <ConfirmModal
        show={showConfirmModal}
        onAction={onConfirmModalAction}
        title="remove column"
        content={'Are you sure you want to remove this column. All related cards will also be removed!'}
      />
    </div>

  )
}

export default Column