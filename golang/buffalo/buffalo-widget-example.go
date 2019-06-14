// actions/app.go
package actions

import (
    "github.com/gobuffalo/buffalo"
    "github.com/gobuffalo/envy"
    forcessl "github.com/gobuffalo/mw-forcessl"
    paramlogger "github.com/gobuffalo/mw-paramlogger"
    "github.com/unrolled/secure"

    "github.com/gobuffalo/buffalo-pop/pop/popmw"
    csrf "github.com/gobuffalo/mw-csrf"
    i18n "github.com/gobuffalo/mw-i18n"
    "github.com/gobuffalo/packr"
    "github.com/markbates/coke/models"
)

// ENV is used to help switch settings based on where the
// application is being run. Default is "development".
var ENV = envy.Get("GO_ENV", "development")
var app *buffalo.App
var T *i18n.Translator

// App is where all routes and middleware for buffalo
// should be defined. This is the nerve center of your
// application.
//
// Routing, middleware, groups, etc... are declared TOP -> DOWN.
// This means if you add a middleware to `app` *after* declaring a
// group, that group will NOT have that new middleware. The same
// is true of resource declarations as well.
//
// It also means that routes are checked in the order they are declared.
// `ServeFiles` is a CATCH-ALL route, so it should always be
// placed last in the route declarations, as it will prevent routes
// declared after it to never be called.
func App() *buffalo.App {
    if app == nil {
        app = buffalo.New(buffalo.Options{
            Env:         ENV,
            SessionName: "_coke_session",
        })

        // Automatically redirect to SSL
        app.Use(forceSSL())

        // Log request parameters (filters apply).
        app.Use(paramlogger.ParameterLogger)

        // Protect against CSRF attacks. https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)
        // Remove to disable this.
        app.Use(csrf.New)

        // Wraps each request in a transaction.
        //  c.Value("tx").(*pop.Connection)
        // Remove to disable this.
        app.Use(popmw.Transaction(models.DB))

        // Setup and use translations:
        app.Use(translations())

        app.GET("/", HomeHandler)

        app.Resource("/widgets", WidgetsResource{})
        app.ServeFiles("/", assetsBox) // serve files from the public directory
    }

    return app
}

// translations will load locale files, set up the translator `actions.T`,
// and will return a middleware to use to load the correct locale for each
// request.
// for more information: https://gobuffalo.io/en/docs/localization
func translations() buffalo.MiddlewareFunc {
    var err error
    if T, err = i18n.New(packr.NewBox("../locales"), "en-US"); err != nil {
        app.Stop(err)
    }
    return T.Middleware()
}

// forceSSL will return a middleware that will redirect an incoming request
// if it is not HTTPS. "http://example.com" => "https://example.com".
// This middleware does **not** enable SSL. for your application. To do that
// we recommend using a proxy: https://gobuffalo.io/en/docs/proxy
// for more information: https://github.com/unrolled/secure/
func forceSSL() buffalo.MiddlewareFunc {
    return forcessl.Middleware(secure.Options{
        SSLRedirect:     ENV == "production",
        SSLProxyHeaders: map[string]string{"X-Forwarded-Proto": "https"},
    })
}

// actions/widgets.go
package actions

import (
    "github.com/gobuffalo/buffalo"
    "github.com/gobuffalo/pop"
    "github.com/markbates/coke/models"
    "github.com/pkg/errors"
)

// This file is generated by Buffalo. It offers a basic structure for
// adding, editing and deleting a page. If your model is more
// complex or you need more than the basic implementation you need to
// edit this file.

// Following naming logic is implemented in Buffalo:
// Model: Singular (Widget)
// DB Table: Plural (widgets)
// Resource: Plural (Widgets)
// Path: Plural (/widgets)
// View Template Folder: Plural (/templates/widgets/)

// WidgetsResource is the resource for the Widget model
type WidgetsResource struct {
    buffalo.Resource
}

// List gets all Widgets. This function is mapped to the path
// GET /widgets
func (v WidgetsResource) List(c buffalo.Context) error {
    // Get the DB connection from the context
    tx, ok := c.Value("tx").(*pop.Connection)
    if !ok {
        return errors.WithStack(errors.New("no transaction found"))
    }

    widgets := &models.Widgets{}

    // Paginate results. Params "page" and "per_page" control pagination.
    // Default values are "page=1" and "per_page=20".
    q := tx.PaginateFromParams(c.Params())

    // Retrieve all Widgets from the DB
    if err := q.All(widgets); err != nil {
        return errors.WithStack(err)
    }

    // Add the paginator to the context so it can be used in the template.
    c.Set("pagination", q.Paginator)

    return c.Render(200, r.Auto(c, widgets))
}

// Show gets the data for one Widget. This function is mapped to
// the path GET /widgets/{widget_id}
func (v WidgetsResource) Show(c buffalo.Context) error {
    // Get the DB connection from the context
    tx, ok := c.Value("tx").(*pop.Connection)
    if !ok {
        return errors.WithStack(errors.New("no transaction found"))
    }

    // Allocate an empty Widget
    widget := &models.Widget{}

    // To find the Widget the parameter widget_id is used.
    if err := tx.Find(widget, c.Param("widget_id")); err != nil {
        return c.Error(404, err)
    }

    return c.Render(200, r.Auto(c, widget))
}

// New renders the form for creating a new Widget.
// This function is mapped to the path GET /widgets/new
func (v WidgetsResource) New(c buffalo.Context) error {
    return c.Render(200, r.Auto(c, &models.Widget{}))
}

// Create adds a Widget to the DB. This function is mapped to the
// path POST /widgets
func (v WidgetsResource) Create(c buffalo.Context) error {
    // Allocate an empty Widget
    widget := &models.Widget{}

    // Bind widget to the html form elements
    if err := c.Bind(widget); err != nil {
        return errors.WithStack(err)
    }

    // Get the DB connection from the context
    tx, ok := c.Value("tx").(*pop.Connection)
    if !ok {
        return errors.WithStack(errors.New("no transaction found"))
    }

    // Validate the data from the html form
    verrs, err := tx.ValidateAndCreate(widget)
    if err != nil {
        return errors.WithStack(err)
    }

    if verrs.HasAny() {
        // Make the errors available inside the html template
        c.Set("errors", verrs)

        // Render again the new.html template that the user can
        // correct the input.
        return c.Render(422, r.Auto(c, widget))
    }

    // If there are no errors set a success message
    c.Flash().Add("success", "Widget was created successfully")

    // and redirect to the widgets index page
    return c.Render(201, r.Auto(c, widget))
}

// Edit renders a edit form for a Widget. This function is
// mapped to the path GET /widgets/{widget_id}/edit
func (v WidgetsResource) Edit(c buffalo.Context) error {
    // Get the DB connection from the context
    tx, ok := c.Value("tx").(*pop.Connection)
    if !ok {
        return errors.WithStack(errors.New("no transaction found"))
    }

    // Allocate an empty Widget
    widget := &models.Widget{}

    if err := tx.Find(widget, c.Param("widget_id")); err != nil {
        return c.Error(404, err)
    }

    return c.Render(200, r.Auto(c, widget))
}

// Update changes a Widget in the DB. This function is mapped to
// the path PUT /widgets/{widget_id}
func (v WidgetsResource) Update(c buffalo.Context) error {
    // Get the DB connection from the context
    tx, ok := c.Value("tx").(*pop.Connection)
    if !ok {
        return errors.WithStack(errors.New("no transaction found"))
    }

    // Allocate an empty Widget
    widget := &models.Widget{}

    if err := tx.Find(widget, c.Param("widget_id")); err != nil {
        return c.Error(404, err)
    }

    // Bind Widget to the html form elements
    if err := c.Bind(widget); err != nil {
        return errors.WithStack(err)
    }

    verrs, err := tx.ValidateAndUpdate(widget)
    if err != nil {
        return errors.WithStack(err)
    }

    if verrs.HasAny() {
        // Make the errors available inside the html template
        c.Set("errors", verrs)

        // Render again the edit.html template that the user can
        // correct the input.
        return c.Render(422, r.Auto(c, widget))
    }

    // If there are no errors set a success message
    c.Flash().Add("success", "Widget was updated successfully")

    // and redirect to the widgets index page
    return c.Render(200, r.Auto(c, widget))
}

// Destroy deletes a Widget from the DB. This function is mapped
// to the path DELETE /widgets/{widget_id}
func (v WidgetsResource) Destroy(c buffalo.Context) error {
    // Get the DB connection from the context
    tx, ok := c.Value("tx").(*pop.Connection)
    if !ok {
        return errors.WithStack(errors.New("no transaction found"))
    }

    // Allocate an empty Widget
    widget := &models.Widget{}

    // To find the Widget the parameter widget_id is used.
    if err := tx.Find(widget, c.Param("widget_id")); err != nil {
        return c.Error(404, err)
    }

    if err := tx.Destroy(widget); err != nil {
        return errors.WithStack(err)
    }

    // If there are no errors set a flash message
    c.Flash().Add("success", "Widget was destroyed successfully")

    // Redirect to the widgets index page
    return c.Render(200, r.Auto(c, widget))
}


// models/models.go
package models

import (
    "log"

    "github.com/gobuffalo/envy"
    "github.com/gobuffalo/pop"
)

// DB is a connection to your database to be used
// throughout your application.
var DB *pop.Connection

func init() {
    var err error
    env := envy.Get("GO_ENV", "development")
    DB, err = pop.Connect(env)
    if err != nil {
        log.Fatal(err)
    }
    pop.Debug = env == "development"
}

// models/widget.go
package models

import (
    "encoding/json"
    "time"

    "github.com/gobuffalo/pop"
    "github.com/gobuffalo/pop/nulls"
    "github.com/gobuffalo/validate"
    "github.com/gobuffalo/validate/validators"
    "github.com/gofrs/uuid"
)

type Widget struct {
    ID          uuid.UUID    `json:"id" db:"id"`
    CreatedAt   time.Time    `json:"created_at" db:"created_at"`
    UpdatedAt   time.Time    `json:"updated_at" db:"updated_at"`
    Title       string       `json:"title" db:"title"`
    Description nulls.String `json:"description" db:"description"`
}

// String is not required by pop and may be deleted
func (w Widget) String() string {
    jw, _ := json.Marshal(w)
    return string(jw)
}

// Widgets is not required by pop and may be deleted
type Widgets []Widget

// String is not required by pop and may be deleted
func (w Widgets) String() string {
    jw, _ := json.Marshal(w)
    return string(jw)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (w *Widget) Validate(tx *pop.Connection) (*validate.Errors, error) {
    return validate.Validate(
        &validators.StringIsPresent{Field: w.Title, Name: "Title"},
    ), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (w *Widget) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
    return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (w *Widget) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
    return validate.NewErrors(), nil
}
