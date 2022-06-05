/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";
import { formatStatus } from "../app/format.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

jest.mock('../app/store', () => mockStore)

describe("Given I am connected as an employee", () => {
  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname });
  }

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    document.body.innerHTML = ""
  })

  describe("When I'm on bills page and I click on eye's icon", () => {
    test("Then click on eye's icon should open modal", async () => {
      const billsClass = new Bills({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      })

      $.fn.modal = jest.fn()
      document.body.innerHTML = BillsUI({ data: bills })

      const handleClickIconEye = jest.fn(billsClass.handleClickIconEye)
      const iconEyeList = await waitFor(() => screen.getAllByTestId('icon-eye'))
      iconEyeList.forEach((iconEye) =>
        iconEye.addEventListener('click', (e) => handleClickIconEye(iconEye))
      )
      userEvent.click(iconEyeList[0])

      expect(handleClickIconEye).toHaveBeenCalled()
      expect(screen.getByTestId('modal-show')).toBeTruthy()

      document.body.innerHTML = ""
    })
  })

  describe("When I'm on bills page and I click on new bill", () => {
    test('Then I should be on NewBill page', async () => {
      const billsClass = new Bills({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage
      })
      document.body.innerHTML = BillsUI({ data: bills })
      jest.spyOn(billsClass, 'handleClickNewBill')
      
      const handleClickNewBill = jest.fn(billsClass.handleClickNewBill)
      const newBillButton = screen.getByTestId("btn-new-bill")
      
     newBillButton.addEventListener("click", handleClickNewBill)

      userEvent.click(newBillButton)

      expect(billsClass.handleClickNewBill).toHaveBeenCalled()

      newBillButton.removeEventListener("click", handleClickNewBill)
    })
  })

  /*Test intégration*/
  describe("When I navigate to bills", () => {
		test("Then bills are fetched from mock API GET", async () => {
      const billsClass = new Bills({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      })

      const getSpy = jest.spyOn(billsClass, 'getBills')
      const data = await billsClass.getBills()
      const mockedBills = await mockStore.bills().list()
      const mockedBillID = mockedBills[0].id
      const mockedBillStatus = mockedBills[0].status
      const mockedBillsLength = mockedBills.length

      expect(getSpy).toHaveBeenCalledTimes(1)
      expect(data[0].id).toEqual(mockedBillID)
      expect(data[0].status).toEqual(formatStatus(mockedBillStatus))
      expect(data.length).toEqual(mockedBillsLength)
		});
	});

  describe("When I navigate to bills and data is corrupted", () => {
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    beforeEach(() => {
      consoleSpy.mockClear()
    })

		test("Then console must display message", async () => {
      const mockedCorruptedBills = {
          list : () => {
            return Promise.resolve([{
            "corruptedDate": "corrupted", 
            "corruptedStatus": "corrupted"
          }])}
      }
      const billsClass = new Bills({
        document,
        onNavigate,
        store: {
          bills: () => mockedCorruptedBills
        },
        localStorage: window.localStorage,
      })

      const getSpy = jest.spyOn(billsClass, 'getBills')
      const data = await billsClass.getBills()
      const mockedBills = await billsClass.store.bills().list()

      expect(getSpy).toHaveBeenCalledTimes(1)      
      expect(console.log).toBeCalled()
		});
	});

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("Then fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
