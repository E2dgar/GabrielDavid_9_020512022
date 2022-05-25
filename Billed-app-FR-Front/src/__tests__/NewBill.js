/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import mockStore from "../__mocks__/store";
import router from "../app/Router.js"


describe("Given I am connected as an employee", () => {
  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  }

  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList.contains("active-icon")).toBeTruthy()
    })
  })

  describe("When I am on NewBill Page and I upload a wrong format file", () => {
    test("Then alert message must be send", async () => {
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      jest.spyOn(window, 'alert')
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))
      const fileInput = await waitFor(() => screen.getByTestId("file"))
      fileInput.addEventListener('change', handleChangeFile)

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test-file'], 'test.ods')
          ]
        }
      })

      expect(handleChangeFile).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith('Format invalide. Formats acceptés: jpg, jpeg, png')
    })
  })

  describe('When I upload a file with a jpg, jpeg or png extension', () => {
    test('Then input file must display input name', async () => {  
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      const fileInput = await waitFor(() => screen.getByTestId("file"))
      fileInput.addEventListener('change', handleChangeFile)

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test-file'], 'test-file.png'),
          ],
        },
      })
      
      expect(handleChangeFile).toHaveBeenCalled()
      expect(fileInput.files[0].name).toBe('test-file.png')
    })
  })

  describe('When I filled in the form correctly and I clicked on submit button', () => {
    test('Then Bills page should be rendered', () => {  
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

      const formNewBill = screen.getByTestId('form-new-bill')
      formNewBill.addEventListener('submit', handleSubmit)

      fireEvent.submit(formNewBill)

      expect(handleSubmit).toHaveBeenCalled()
      expect(screen.getByTestId('note-de-frais-heading')).toBeTruthy()
    })

    test('Then a new bill should be created in the API', async () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const fakeBill = {
        type: 'Transports',
        name: 'Test name',
        date: '25-05-2022',
        amount: '800',
        vat: '30',
        pct: '10',
        commentary: '',
        filename: 'bill',
        fileUrl: 'fakepath/bill.jpg'
      }

      const spyHandleSubmit = jest.spyOn(newBill, 'handleSubmit')
      const form = screen.getByTestId('form-new-bill')
      const btnSubmitForm = form.querySelector('#btn-send-bill')

      const spyUpdateBill = jest.spyOn(newBill, 'updateBill')

      fireEvent.change(screen.getByTestId('expense-type'), { target: { value: fakeBill.type } })
      fireEvent.change(screen.getByTestId('expense-name'), { target: { value: fakeBill.name } })
      fireEvent.change(screen.getByTestId('datepicker'), { target: { value: fakeBill.date } })
      fireEvent.change(screen.getByTestId('amount'), { target: { value: fakeBill.amount } })
      fireEvent.change(screen.getByTestId('vat'), { target: { value: fakeBill.vat } })
      fireEvent.change(screen.getByTestId('pct'), { target: { value: fakeBill.pct } })
      fireEvent.change(screen.getByTestId('commentary'), { target: { value: fakeBill.commentary } })

      form.addEventListener('submit', ((event) => newBill.handleSubmit(event)))
      userEvent.click(btnSubmitForm)

      await waitFor(() => screen.getByTestId('note-de-frais-heading'))
      expect(spyHandleSubmit).toHaveBeenCalled()
      expect(spyUpdateBill).toHaveBeenCalled()
    })
  })  
})
