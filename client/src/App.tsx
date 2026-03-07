import { Route, Switch } from "wouter";
import Navigation from "./components/Navigation";
import HomePage from "./pages/home";
import UploadPage from "./pages/upload";
import RecordsPage from "./pages/records";
import RecordDetailPage from "./pages/record-detail";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/upload" component={UploadPage} />
          <Route path="/records" component={RecordsPage} />
          <Route path="/records/:id" component={RecordDetailPage} />
          <Route>
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold">404 - Página no encontrada</h1>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}
