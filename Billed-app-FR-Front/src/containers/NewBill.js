import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile = e => {
    e.preventDefault()

    const fileInput = this.document.querySelector(`input[data-testid="file"]`)
    const filePath = e.target.value.split(/\\/g)
    const imgFile = {
      file: fileInput.files[0],
      fileName: fileInput.files[0].name,
    }
    console.log(imgFile.fileName)
    const fileExtension = imgFile.fileName.split(".")[1]
    
    console.log(fileExtension)
    const allowedExtensions = ["jpg", "jpeg", "png"]

    if(!allowedExtensions.includes(fileExtension)){
      alert('Format invalide. Formats acceptés: jpg, jpeg, png');
      fileInput.value = ''
      return 
    }

    this.createFormData(imgFile)
  }

  createFormData = imgFile => {
    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', imgFile.file)
    formData.append('email', email)

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({fileUrl, key}) => {
        console.log(fileUrl)
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = imgFile.fileName
      }).catch(error => console.error(error))
  }

  handleSubmit = e => {
    e.preventDefault()
    /*console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)*/
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}